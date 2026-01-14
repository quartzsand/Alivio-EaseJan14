import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Expo Haptics only exposes discrete primitives (selection/impact/notification). :contentReference[oaicite:2]{index=2}
// We approximate “carrier + envelope + reset accents” by scheduling these primitives.

export type InjectionSite =
  | "fingerPad"
  | "thighLateral"
  | "abdomen"
  | "deltoid";
export type AgeGroup = "infant" | "toddler" | "teen" | "adult" | "obeseAdult";

export type HapticsRequest =
  | { kind: "injectionPrep"; site: InjectionSite; ageGroup: AgeGroup }
  | { kind: "injectionActive"; site: InjectionSite; ageGroup: AgeGroup }
  | {
      kind: "discoveryTrial";
      site: InjectionSite;
      ageGroup: AgeGroup;
      trialId: DiscoveryTrialId;
    }
  | { kind: "stop" };

export type DiscoveryTrialId = "crisp" | "deep" | "balanced";

export interface TunedProfile {
  site: InjectionSite;
  ageGroup: AgeGroup;

  // “Bed” (carrier-like occupancy) is implemented as frequent subtle taps
  bedIntervalMs: number; // e.g., 120–220ms
  bedStyle: BedStyle; // selection or soft/light impacts

  // Envelope sweep (burst cadence)
  envelopeHzMin: number; // e.g., 10–28
  envelopeHzMax: number;
  burstOnMs: number; // e.g., 120–260
  burstOffMsMin: number; // randomization for anti-habituation
  burstOffMsMax: number;

  // Optional reset accents (seconds; 0 disables)
  resetEverySeconds: number; // 2–3s typical for thigh/abdomen, 0 for finger
  resetStyle: ResetStyle; // doubleTap or triplet
}

type BedStyle = "selection" | "softImpact" | "lightImpact";
type ResetStyle = "doubleTap" | "triplet";

export interface DiscoveryTrial {
  id: DiscoveryTrialId;
  title: string;
  prompt: string;
  profile: TunedProfile;
}

const STORAGE_KEY = "alivio:tunedProfiles:v1";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function key(site: InjectionSite, ageGroup: AgeGroup) {
  return `${site}|${ageGroup}`;
}

export class HapticsService {
  private static _instance: HapticsService | null = null;
  static get instance() {
    if (!this._instance) this._instance = new HapticsService();
    return this._instance;
  }

  // Sliders (0..1)
  private _hapticsLevel = 0.85;
  private _audioLevel = 0.65;

  // Run control
  private runId = 0;
  private running = false;

  // Profiles cache
  private tunedProfiles: Record<string, TunedProfile> = {};

  // Audio
  private sound: Audio.Sound | null = null;
  private audioPrepared = false;

  private constructor() {}

  // Call once at app startup
  async init() {
    await this.loadTunedProfiles();
    await this.prepareAudio();
  }

  setHapticsLevel(level01: number) {
    this._hapticsLevel = clamp01(level01);
  }

  setAudioLevel(level01: number) {
    this._audioLevel = clamp01(level01);
    this.applyAudioVolume().catch(() => {});
  }

  get hapticsLevel() {
    return this._hapticsLevel;
  }

  get audioLevel() {
    return this._audioLevel;
  }

  // ---- Public API ----

  async play(req: HapticsRequest) {
    if (req.kind === "stop") {
      await this.stop();
      return;
    }

    const profile =
      req.kind === "discoveryTrial"
        ? this.resolveDiscoveryProfile(req.site, req.ageGroup, req.trialId)
        : this.resolveProfile(req.site, req.ageGroup);

    const kind =
      req.kind === "injectionPrep"
        ? "prep"
        : req.kind === "injectionActive"
          ? "active"
          : "discovery";

    // Cancel any existing run
    this.runId++;
    const myRunId = this.runId;
    this.running = true;

    // Start audio loop (entrainment/distraction)
    await this.startAudioLoop(kind);

    // Run the haptics scheduler
    try {
      const durationMs =
        kind === "prep"
          ? 15000
          : kind === "active"
            ? req.site === "fingerPad"
              ? 8000
              : 10000
            : 3200;

      await this.runPattern(profile, durationMs, myRunId);
    } finally {
      // For discovery trials, stop immediately after trial. For prep/active you can decide via UX.
      if (kind === "discovery") {
        await this.stop();
      }
    }
  }

  async stop() {
    this.runId++;
    this.running = false;
    await this.stopAudio();
  }

  makeDiscoveryTrials(
    site: InjectionSite,
    ageGroup: AgeGroup,
  ): DiscoveryTrial[] {
    const base = this.defaultProfile(site, ageGroup);

    const crisp: TunedProfile = {
      ...base,
      bedStyle: "lightImpact",
      bedIntervalMs: Math.max(90, base.bedIntervalMs - 20),
      envelopeHzMin: base.envelopeHzMin + 2,
      envelopeHzMax: base.envelopeHzMax + 2,
      burstOnMs: Math.max(80, base.burstOnMs - 40),
      resetEverySeconds: base.resetEverySeconds, // keep same
    };

    const deep: TunedProfile = {
      ...base,
      bedStyle: "softImpact",
      bedIntervalMs: base.bedIntervalMs + 30,
      envelopeHzMin: Math.max(8, base.envelopeHzMin - 2),
      envelopeHzMax: Math.max(
        Math.max(10, base.envelopeHzMin),
        base.envelopeHzMax - 2,
      ),
      burstOnMs: Math.min(320, base.burstOnMs + 60),
      resetEverySeconds: base.resetEverySeconds || (site === "abdomen" ? 2 : 3),
    };

    const balanced: TunedProfile = {
      ...base,
      resetEverySeconds: base.resetEverySeconds || (site === "abdomen" ? 2 : 3),
    };

    return [
      {
        id: "crisp",
        title: "Trial A — Crisp",
        prompt: "Does this feel clean/precise (vs. harsh/annoying)?",
        profile: crisp,
      },
      {
        id: "deep",
        title: "Trial B — Deep Roll",
        prompt:
          "Does this feel deeper/spreading into tissue (vs. surface buzz)?",
        profile: deep,
      },
      {
        id: "balanced",
        title: "Trial C — Balanced",
        prompt: "Best overall: deep + comfortable + not irritating?",
        profile: balanced,
      },
    ];
  }

  async finalizeDiscovery(
    site: InjectionSite,
    ageGroup: AgeGroup,
    chosen: DiscoveryTrialId,
  ) {
    const profile = this.resolveDiscoveryProfile(site, ageGroup, chosen);

    // Apply slider effects to the tuned profile logic:
    // We cannot control amplitude directly via expo-haptics; we approximate “more intense” by:
    // - using stronger impact styles more often
    // - increasing density slightly at higher levels
    const adjusted = this.applyLevelToProfile(profile);

    await this.setTunedProfile(adjusted);
    return adjusted;
  }

  // ---- Persistence ----

  private async loadTunedProfiles() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      this.tunedProfiles = JSON.parse(raw);
    } catch {
      this.tunedProfiles = {};
    }
  }

  private async saveTunedProfiles() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.tunedProfiles));
  }

  private async setTunedProfile(profile: TunedProfile) {
    this.tunedProfiles[key(profile.site, profile.ageGroup)] = profile;
    await this.saveTunedProfiles();
  }

  // ---- Profile Resolution ----

  private resolveProfile(
    site: InjectionSite,
    ageGroup: AgeGroup,
  ): TunedProfile {
    const k = key(site, ageGroup);
    return this.tunedProfiles[k] ?? this.defaultProfile(site, ageGroup);
  }

  private resolveDiscoveryProfile(
    site: InjectionSite,
    ageGroup: AgeGroup,
    trialId: DiscoveryTrialId,
  ): TunedProfile {
    const trials = this.makeDiscoveryTrials(site, ageGroup);
    const t = trials.find((x) => x.id === trialId);
    return t ? t.profile : this.defaultProfile(site, ageGroup);
  }

  private defaultProfile(
    site: InjectionSite,
    ageGroup: AgeGroup,
  ): TunedProfile {
    // Site priors (Expo-friendly): choose cadence + styles.
    let p: TunedProfile;

    switch (site) {
      case "fingerPad":
        p = {
          site,
          ageGroup,
          bedIntervalMs: 120,
          bedStyle: "lightImpact",
          envelopeHzMin: 22,
          envelopeHzMax: 28,
          burstOnMs: 120,
          burstOffMsMin: 80,
          burstOffMsMax: 140,
          resetEverySeconds: 0,
          resetStyle: "doubleTap",
        };
        break;

      case "thighLateral":
        p = {
          site,
          ageGroup,
          bedIntervalMs: 160,
          bedStyle: "softImpact",
          envelopeHzMin: 12,
          envelopeHzMax: 20,
          burstOnMs: 250,
          burstOffMsMin: 250,
          burstOffMsMax: 400,
          resetEverySeconds: 3,
          resetStyle: "doubleTap",
        };
        break;

      case "abdomen":
        p = {
          site,
          ageGroup,
          bedIntervalMs: 180,
          bedStyle: "selection",
          envelopeHzMin: 10,
          envelopeHzMax: 16,
          burstOnMs: 200,
          burstOffMsMin: 300,
          burstOffMsMax: 500,
          resetEverySeconds: 2,
          resetStyle: "triplet",
        };
        break;

      case "deltoid":
      default:
        p = {
          site,
          ageGroup,
          bedIntervalMs: 160,
          bedStyle: "softImpact",
          envelopeHzMin: 14,
          envelopeHzMax: 22,
          burstOnMs: 220,
          burstOffMsMin: 220,
          burstOffMsMax: 360,
          resetEverySeconds: 3,
          resetStyle: "doubleTap",
        };
        break;
    }

    // Age shaping (conservative)
    if (ageGroup === "infant" || ageGroup === "toddler") {
      p.bedIntervalMs += 30; // less dense
      p.bedStyle = "selection"; // gentler
      p.envelopeHzMin = Math.max(8, p.envelopeHzMin - 1);
      p.envelopeHzMax = Math.max(p.envelopeHzMin + 2, p.envelopeHzMax - 1);
    } else if (ageGroup === "teen") {
      p.bedIntervalMs += 10;
    } else if (ageGroup === "obeseAdult") {
      p.bedIntervalMs += 10;
      p.envelopeHzMin = Math.max(8, p.envelopeHzMin - 1.5);
      p.envelopeHzMax = Math.max(p.envelopeHzMin + 2, p.envelopeHzMax - 1);
      if (site === "abdomen") p.resetEverySeconds = 2;
    }

    return p;
  }

  // Approximate the intensity slider by shifting style and density.
  private applyLevelToProfile(profile: TunedProfile): TunedProfile {
    const lvl = this._hapticsLevel;

    let bedStyle: BedStyle = profile.bedStyle;
    let bedIntervalMs = profile.bedIntervalMs;

    if (lvl < 0.33) {
      bedStyle = "selection";
      bedIntervalMs = Math.max(170, bedIntervalMs + 40);
    } else if (lvl < 0.66) {
      bedStyle = profile.site === "fingerPad" ? "lightImpact" : "softImpact";
      bedIntervalMs = Math.max(120, bedIntervalMs);
    } else {
      bedStyle = profile.site === "abdomen" ? "softImpact" : "lightImpact";
      bedIntervalMs = Math.max(100, bedIntervalMs - 10);
    }

    return { ...profile, bedStyle, bedIntervalMs };
  }

  // ---- Scheduler (carrier + envelope + resets) ----

  private async runPattern(
    profile: TunedProfile,
    durationMs: number,
    myRunId: number,
  ) {
    const start = Date.now();
    let nextBed = start;
    let nextReset =
      profile.resetEverySeconds > 0
        ? start + profile.resetEverySeconds * 1000
        : Number.POSITIVE_INFINITY;

    // Envelope sweep variables
    let t = 0;

    while (this.running && myRunId === this.runId) {
      const now = Date.now();
      const elapsed = now - start;
      if (elapsed >= durationMs) break;

      // 1) Carrier bed tick (subtle occupancy)
      if (now >= nextBed) {
        await this.bedTick(profile);
        nextBed = now + profile.bedIntervalMs;
      }

      // 2) Resets (anti-habituation accents)
      if (now >= nextReset) {
        await this.resetAccent(profile);
        nextReset = now + profile.resetEverySeconds * 1000;
      }

      // 3) Envelope bursts: we drive this as a periodic “burst window”
      // We schedule bursts based on a swept target cycle length:
      // cycleMs ≈ 1000 / Hz(t)
      const progress = clamp01(elapsed / durationMs);
      const hz = lerp(profile.envelopeHzMin, profile.envelopeHzMax, progress);
      const cycleMs = 1000 / Math.max(1, hz);

      // We trigger a burst roughly once per cycle, but with randomized off-time.
      // Implement as: burst (onMs) + off (randomized, blended toward target cycle).
      if (t <= 0) {
        await this.burstWindow(profile, myRunId);

        const targetOff = Math.max(20, cycleMs - profile.burstOnMs);
        const offRand = randInt(profile.burstOffMsMin, profile.burstOffMsMax);
        const offMs = 0.7 * offRand + 0.3 * targetOff;

        // mild jitter
        const jitter = 1 + (Math.random() * 0.16 - 0.08);
        t = offMs * jitter;
      } else {
        // decrement using small sleep to keep responsiveness
        const step = Math.min(25, t);
        await sleep(step);
        t -= step;
      }
    }
  }

  private async bedTick(profile: TunedProfile) {
    // Expo haptics primitives. :contentReference[oaicite:3]{index=3}
    // “Intensity” is approximated by style choice + density.
    if (profile.bedStyle === "selection") {
      await Haptics.selectionAsync();
      return;
    }

    const style =
      profile.bedStyle === "softImpact"
        ? Haptics.ImpactFeedbackStyle.Soft
        : Haptics.ImpactFeedbackStyle.Light;

    await Haptics.impactAsync(style);
  }

  private async burstWindow(profile: TunedProfile, myRunId: number) {
    // Burst window: a few stronger taps spaced ~60ms apart for salience
    const count = Math.max(2, Math.floor(profile.burstOnMs / 60));
    for (let i = 0; i < count; i++) {
      if (!this.running || myRunId !== this.runId) return;

      const style = this.chooseBurstStyle(profile);
      await Haptics.impactAsync(style);
      await sleep(60);
    }
  }

  private chooseBurstStyle(profile: TunedProfile) {
    // Map slider + site to a style.
    // (Expo supports Light/Medium/Heavy/Rigid/Soft. :contentReference[oaicite:4]{index=4})
    const lvl = this._hapticsLevel;

    if (profile.site === "fingerPad") {
      if (lvl > 0.75) return Haptics.ImpactFeedbackStyle.Rigid;
      if (lvl > 0.45) return Haptics.ImpactFeedbackStyle.Heavy;
      return Haptics.ImpactFeedbackStyle.Medium;
    }

    if (profile.site === "abdomen") {
      if (lvl > 0.75) return Haptics.ImpactFeedbackStyle.Heavy;
      if (lvl > 0.45) return Haptics.ImpactFeedbackStyle.Medium;
      return Haptics.ImpactFeedbackStyle.Soft;
    }

    // thigh/deltoid
    if (lvl > 0.75) return Haptics.ImpactFeedbackStyle.Heavy;
    if (lvl > 0.45) return Haptics.ImpactFeedbackStyle.Medium;
    return Haptics.ImpactFeedbackStyle.Light;
  }

  private async resetAccent(profile: TunedProfile) {
    if (profile.resetStyle === "triplet") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sleep(60);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sleep(60);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    // doubleTap
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await sleep(70);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // ---- Audio (expo-av) ----

  private async prepareAudio() {
    try {
      // Allows audio in iOS Silent Mode if you want it. :contentReference[oaicite:5]{index=5}
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      // Put a short loop file at: assets/audio/entrain_loop.mp3
      // Keep it low amplitude; volume slider will scale it further.
      const { sound } = await Audio.Sound.createAsync(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("../../assets/audio/entrain_loop.mp3"),
        { isLooping: true, volume: this._audioLevel, shouldPlay: false },
      );
      this.sound = sound;
      this.audioPrepared = true;
    } catch {
      this.audioPrepared = false;
      this.sound = null;
    }
  }

  private async applyAudioVolume() {
    if (!this.sound) return;
    try {
      await this.sound.setVolumeAsync(this._audioLevel);
    } catch {}
  }

  private async startAudioLoop(kind: "prep" | "active" | "discovery") {
    if (!this.audioPrepared) return;
    if (!this.sound) return;

    // Keep discovery quiet by default
    const vol =
      kind === "discovery" ? this._audioLevel * 0.75 : this._audioLevel;

    try {
      await this.sound.setVolumeAsync(vol);
      const status = await this.sound.getStatusAsync();
      if ("isLoaded" in status && status.isLoaded && !status.isPlaying) {
        await this.sound.playAsync();
      }
    } catch {}
  }

  private async stopAudio() {
    if (!this.sound) return;
    try {
      const status = await this.sound.getStatusAsync();
      if ("isLoaded" in status && status.isLoaded && status.isPlaying) {
        await this.sound.stopAsync();
      }
    } catch {}
  }
}
