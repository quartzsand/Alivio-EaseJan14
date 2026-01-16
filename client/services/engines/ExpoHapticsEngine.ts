// client/services/engines/ExpoHapticsEngine.ts
import * as Haptics from "expo-haptics";

export type PeakStyle = "max" | "snap";
export type SessionPhase = "idle" | "settle" | "peak" | "coolDown" | "complete";

export type SensorySettings = {
  useAdvancedHaptics: boolean; // not used here, but kept for shared shape
  hapticsIntensity01: number; // 0..1
  audioVolume01: number; // not used here, but kept for shared shape
  peakStyle: PeakStyle; // max | snap
  snapDensity01: number; // 0..1 (used only when peakStyle="snap")
};

type TimeoutHandle = ReturnType<typeof setTimeout>;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export class ExpoHapticsEngine {
  private intensity01 = 0.85;

  private running = false;
  private runId = 0;

  private phase: SessionPhase = "idle";
  private settings: SensorySettings | null = null;
  private patternId = "default";

  private bedTimer: TimeoutHandle | null = null;
  private burstTimer: TimeoutHandle | null = null;

  async init() {
    // expo-haptics requires no explicit init
  }

  setIntensity(level01: number) {
    this.intensity01 = clamp01(level01);
  }

  /**
   * REQUIRED SIGNATURE for your codebase:
   * start(pattern, phase, settings)
   */
  async start(pattern: any, phase: SessionPhase, settings: SensorySettings) {
    await this.stopAll();

    this.patternId = this.normalizePatternId(pattern);
    this.phase = phase;
    this.settings = settings;
    this.setIntensity(settings.hapticsIntensity01);

    this.running = true;
    this.runId++;

    this.startLoops(this.runId);
  }

  /**
   * REQUIRED SIGNATURE for your codebase:
   * updatePhase(phase)
   */
  updatePhase(phase: SessionPhase) {
    if (!this.running) return;
    if (this.phase === phase) return;

    this.phase = phase;

    // Re-schedule with new phase timings
    this.clearTimers();
    this.startLoops(this.runId);
  }

  async stopAll() {
    this.running = false;
    this.runId++;
    this.clearTimers();
  }

  async dispose() {
    await this.stopAll();
  }

  // ------------------------
  // Scheduling
  // ------------------------

  private clearTimers() {
    if (this.bedTimer) clearTimeout(this.bedTimer);
    if (this.burstTimer) clearTimeout(this.burstTimer);
    this.bedTimer = null;
    this.burstTimer = null;
  }

  private startLoops(myRunId: number) {
    this.scheduleBed(myRunId);
    this.scheduleBurst(myRunId);
  }

  private scheduleBed(myRunId: number) {
    if (!this.running || myRunId !== this.runId) return;

    const interval = this.getBedIntervalMs();
    const jitter = interval * (0.88 + Math.random() * 0.24);

    this.bedTimer = setTimeout(async () => {
      if (!this.running || myRunId !== this.runId) return;
      await this.fireBedTick();
      this.scheduleBed(myRunId);
    }, jitter);
  }

  private scheduleBurst(myRunId: number) {
    if (!this.running || myRunId !== this.runId) return;

    const interval = this.getBurstEveryMs();
    const jitter = interval * (0.85 + Math.random() * 0.3);

    this.burstTimer = setTimeout(async () => {
      if (!this.running || myRunId !== this.runId) return;
      await this.fireBurst();
      this.scheduleBurst(myRunId);
    }, jitter);
  }

  // ------------------------
  // Phase timing model
  // ------------------------

  private isCrispPattern() {
    return /digital|finger|edge|crisp/i.test(this.patternId);
  }

  private isDeepPattern() {
    return /deep|thigh|abdomen|buffer/i.test(this.patternId);
  }

  private getBedIntervalMs() {
    // "Bed" is the frequent occupancy tick that reads as buzzing.
    // Stronger feel = denser bed.
    const lvl = this.intensity01;

    // Base per phase
    let ms =
      this.phase === "peak"
        ? 95
        : this.phase === "settle"
          ? 130
          : this.phase === "coolDown"
            ? 170
            : 180;

    // Pattern shaping
    if (this.isCrispPattern()) ms -= 12;
    if (this.isDeepPattern()) ms += 10;

    // Intensity slider increases density
    ms -= Math.round(lvl * 18);

    // PeakStyle "max" pushes density a bit further
    if (this.phase === "peak" && this.settings?.peakStyle === "max") {
      ms -= 10;
    }

    // Clamp to avoid extreme CPU load / iOS throttling
    return Math.max(70, Math.min(220, ms));
  }

  private getBurstEveryMs() {
    // Bursts are the "swingy" salience events. Peak should feel urgent/alive.
    const lvl = this.intensity01;
    const peakStyle = this.settings?.peakStyle ?? "max";
    const snap01 = clamp01(this.settings?.snapDensity01 ?? 0.5);

    if (this.phase === "peak") {
      if (peakStyle === "snap") {
        // Snap = controllable burst frequency.
        // Map snap01 to approx 1.5 .. 6.0 snaps/sec => 666ms .. 166ms
        const snapsPerSec = 1.5 + 4.5 * snap01;
        const ms = 1000 / snapsPerSec;
        return Math.max(150, Math.min(700, ms));
      }

      // Max = heavy/rigid bursts, very frequent
      const ms = 260 - Math.round(lvl * 80);
      return Math.max(140, Math.min(320, ms));
    }

    if (this.phase === "settle") {
      const ms = 520 - Math.round(lvl * 120);
      return Math.max(260, Math.min(650, ms));
    }

    // coolDown
    const ms = 780 - Math.round(lvl * 120);
    return Math.max(420, Math.min(900, ms));
  }

  // ------------------------
  // Haptic primitives
  // ------------------------

  private async fireBedTick() {
    // Bed tick should be fast and "present" but not always heavy.
    const lvl = this.intensity01;

    // In low intensity, use selection pulses to stay comfortable.
    if (lvl < 0.3) {
      await Haptics.selectionAsync();
      return;
    }

    // Decide style by phase + pattern
    const crisp = this.isCrispPattern();

    let style: Haptics.ImpactFeedbackStyle =
      this.phase === "peak"
        ? crisp
          ? Haptics.ImpactFeedbackStyle.Rigid
          : Haptics.ImpactFeedbackStyle.Heavy
        : this.phase === "settle"
          ? crisp
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Soft
          : Haptics.ImpactFeedbackStyle.Soft;

    // Scale down if intensity isn't high
    if (lvl < 0.55 && style === Haptics.ImpactFeedbackStyle.Heavy) {
      style = Haptics.ImpactFeedbackStyle.Medium;
    }

    await Haptics.impactAsync(style);
  }

  private async fireBurst() {
    // Bursts: 2–4 impacts in a tight cluster (reads as "alive" and distracting).
    const lvl = this.intensity01;
    const crisp = this.isCrispPattern();

    // How many hits in a burst
    let hits = this.phase === "peak" ? 3 : this.phase === "settle" ? 2 : 2;

    // In "max" peak, slightly more salience
    if (
      this.phase === "peak" &&
      (this.settings?.peakStyle ?? "max") === "max" &&
      lvl > 0.7
    ) {
      hits = 4;
    }

    // Style selection
    let style: Haptics.ImpactFeedbackStyle =
      this.phase === "peak"
        ? crisp
          ? Haptics.ImpactFeedbackStyle.Rigid
          : Haptics.ImpactFeedbackStyle.Heavy
        : this.phase === "settle"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Soft;

    // If intensity low, avoid harshness
    if (lvl < 0.45 && this.phase !== "peak") {
      style = Haptics.ImpactFeedbackStyle.Soft;
    }

    // Tight spacing (ms) – peak is tighter
    const gap = this.phase === "peak" ? 45 : 60;

    for (let i = 0; i < hits; i++) {
      // Cancel if stopped mid-burst
      if (!this.running) return;
      await Haptics.impactAsync(style);
      if (i < hits - 1) await sleep(gap);
    }
  }

  private normalizePatternId(pattern: any) {
    if (!pattern) return "default";
    if (typeof pattern === "string") return pattern;
    if (typeof pattern?.id === "string") return pattern.id;
    if (typeof pattern?.kind === "string") return pattern.kind;
    if (typeof pattern?.name === "string") return pattern.name;
    return "default";
  }
}
