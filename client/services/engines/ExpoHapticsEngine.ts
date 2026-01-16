// client/services/engines/ExpoHapticsEngine.ts
import * as Haptics from "expo-haptics";
import type { HapticPattern } from "@/types";

export type PeakStyle = "max" | "snap";

export type SensorySettings = {
  useAdvancedHaptics: boolean; // ignored by Expo engine, used by future native engine
  hapticsIntensity01: number;
  peakStyle: PeakStyle;
  snapDensity01: number;
  audioVolume01: number; // not used here, but convenient to keep in one settings object
};

type Phase = "settle" | "peak" | "coolDown";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class ExpoHapticsEngine {
  private running = false;
  private runId = 0;

  private pattern: HapticPattern = "standard";
  private phase: Phase = "settle";
  private settings: SensorySettings = {
    useAdvancedHaptics: false,
    hapticsIntensity01: 0.85,
    peakStyle: "max",
    snapDensity01: 0.5,
    audioVolume01: 0.6,
  };

  private bedTimeout: ReturnType<typeof setTimeout> | null = null;
  private envTimeout: ReturnType<typeof setTimeout> | null = null;

  async init() {
    // Expo Haptics has no explicit init requirement, but keep for parity with future engines.
    return;
  }

  setIntensity(level01: number) {
    this.settings.hapticsIntensity01 = clamp01(level01);
  }

  async start(pattern: HapticPattern, phase: Phase, settings: SensorySettings) {
    this.pattern = pattern;
    this.phase = phase;
    this.settings = { ...this.settings, ...settings };
    this.running = true;

    // hard restart loops so phase changes feel immediate
    this.runId++;
    const myRun = this.runId;

    this.clearTimers();
    void this.loopBed(myRun);
    void this.loopEnvelope(myRun);
  }

  updatePhase(phase: Phase) {
    if (this.phase === phase) return;
    this.phase = phase;

    if (!this.running) return;

    // restart loops to re-shape immediately for new phase
    this.runId++;
    const myRun = this.runId;
    this.clearTimers();
    void this.loopBed(myRun);
    void this.loopEnvelope(myRun);
  }

  async stopAll() {
    this.running = false;
    this.runId++;
    this.clearTimers();
  }

  async dispose() {
    await this.stopAll();
  }

  // ---------- Scheduling ----------

  private clearTimers() {
    if (this.bedTimeout) clearTimeout(this.bedTimeout);
    if (this.envTimeout) clearTimeout(this.envTimeout);
    this.bedTimeout = null;
    this.envTimeout = null;
  }

  private baseBedIntervalMs(): number {
    // Baseline density by pattern
    switch (this.pattern) {
      case "gentle-wave":
        return 210;
      case "soft-pulse":
        return 185;
      case "standard":
      default:
        return 165;
    }
  }

  private phaseBedMultiplier(): number {
    if (this.phase === "peak") return 0.78;
    if (this.phase === "coolDown") return 1.15;
    return 1.0; // settle
  }

  private intensityBedMultiplier(): number {
    // higher intensity -> slightly denser
    const i = clamp01(this.settings.hapticsIntensity01);
    return lerp(1.22, 0.82, i);
  }

  private bedIntervalMs(): number {
    const ms =
      this.baseBedIntervalMs() *
      this.phaseBedMultiplier() *
      this.intensityBedMultiplier();

    // prevent pathological rates
    return Math.max(85, Math.min(320, Math.round(ms)));
  }

  private burstGroupPauseMs(): number {
    // How often we create a burst group
    // settle: slower, peak: faster, cool: slower
    const snap = clamp01(this.settings.snapDensity01);

    if (this.phase === "peak") return Math.round(lerp(420, 160, snap));
    if (this.phase === "coolDown") return Math.round(lerp(650, 380, snap));
    return Math.round(lerp(560, 280, snap)); // settle
  }

  private burstSnapsCount(): number {
    // snapDensity controls “how many snaps occur” during peak when peakStyle="snap"
    const snap = clamp01(this.settings.snapDensity01);
    return Math.round(lerp(2, 7, snap));
  }

  private chooseBedStyle(): Haptics.ImpactFeedbackStyle | "selection" {
    const i = clamp01(this.settings.hapticsIntensity01);

    if (this.phase === "coolDown") {
      if (i < 0.35) return "selection";
      return Haptics.ImpactFeedbackStyle.Soft;
    }

    if (this.phase === "settle") {
      if (i < 0.3) return "selection";
      if (i < 0.65) return Haptics.ImpactFeedbackStyle.Light;
      return Haptics.ImpactFeedbackStyle.Medium;
    }

    // peak
    if (this.settings.peakStyle === "max") {
      // your requirement: “Max” always mean 100% Heavy impacts + highest density
      return Haptics.ImpactFeedbackStyle.Heavy;
    }

    // snap peak: still strong, but feels “snappier”
    return i > 0.7
      ? Haptics.ImpactFeedbackStyle.Rigid
      : Haptics.ImpactFeedbackStyle.Heavy;
  }

  private chooseBurstStyle(): Haptics.ImpactFeedbackStyle {
    const i = clamp01(this.settings.hapticsIntensity01);

    if (this.phase === "coolDown") {
      return i > 0.6
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Soft;
    }

    if (this.phase === "settle") {
      return i > 0.7
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    }

    // peak
    if (this.settings.peakStyle === "max")
      return Haptics.ImpactFeedbackStyle.Heavy;
    return i > 0.7
      ? Haptics.ImpactFeedbackStyle.Rigid
      : Haptics.ImpactFeedbackStyle.Heavy;
  }

  private async loopBed(myRun: number) {
    if (!this.running || myRun !== this.runId) return;

    try {
      const bedStyle = this.chooseBedStyle();
      if (bedStyle === "selection") await Haptics.selectionAsync();
      else await Haptics.impactAsync(bedStyle);
    } catch {
      // ignore
    }

    if (!this.running || myRun !== this.runId) return;

    const next = this.bedIntervalMs();
    this.bedTimeout = setTimeout(() => void this.loopBed(myRun), next);
  }

  private async loopEnvelope(myRun: number) {
    if (!this.running || myRun !== this.runId) return;

    try {
      if (this.phase === "peak" && this.settings.peakStyle === "snap") {
        // SNAP mode: user controls “how many snaps occur”
        const snaps = this.burstSnapsCount();
        const style = this.chooseBurstStyle();

        for (let k = 0; k < snaps; k++) {
          if (!this.running || myRun !== this.runId) return;
          await Haptics.impactAsync(style);
          // snap spacing
          await new Promise((r) => setTimeout(r, 55));
        }
      } else {
        // MAX peak (or settle/cool): a small burst group (2–4 pulses)
        const style = this.chooseBurstStyle();
        const count =
          this.phase === "peak" ? 4 : this.phase === "settle" ? 3 : 2;

        for (let k = 0; k < count; k++) {
          if (!this.running || myRun !== this.runId) return;
          await Haptics.impactAsync(style);
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    } catch {
      // ignore
    }

    if (!this.running || myRun !== this.runId) return;

    const pause = this.burstGroupPauseMs();
    this.envTimeout = setTimeout(() => void this.loopEnvelope(myRun), pause);
  }
}
// client/services/engines/ExpoHapticsEngine.ts
import * as Haptics from "expo-haptics";
import type { HapticPattern } from "@/types";

export type PeakStyle = "max" | "snap";

export type SensorySettings = {
  useAdvancedHaptics: boolean; // ignored by Expo engine, used by future native engine
  hapticsIntensity01: number;
  peakStyle: PeakStyle;
  snapDensity01: number;
  audioVolume01: number; // not used here, but convenient to keep in one settings object
};

type Phase = "settle" | "peak" | "coolDown";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class ExpoHapticsEngine {
  private running = false;
  private runId = 0;

  private pattern: HapticPattern = "standard";
  private phase: Phase = "settle";
  private settings: SensorySettings = {
    useAdvancedHaptics: false,
    hapticsIntensity01: 0.85,
    peakStyle: "max",
    snapDensity01: 0.5,
    audioVolume01: 0.6,
  };

  private bedTimeout: ReturnType<typeof setTimeout> | null = null;
  private envTimeout: ReturnType<typeof setTimeout> | null = null;

  async init() {
    // Expo Haptics has no explicit init requirement, but keep for parity with future engines.
    return;
  }

  setIntensity(level01: number) {
    this.settings.hapticsIntensity01 = clamp01(level01);
  }

  async start(pattern: HapticPattern, phase: Phase, settings: SensorySettings) {
    this.pattern = pattern;
    this.phase = phase;
    this.settings = { ...this.settings, ...settings };
    this.running = true;

    // hard restart loops so phase changes feel immediate
    this.runId++;
    const myRun = this.runId;

    this.clearTimers();
    void this.loopBed(myRun);
    void this.loopEnvelope(myRun);
  }

  updatePhase(phase: Phase) {
    if (this.phase === phase) return;
    this.phase = phase;

    if (!this.running) return;

    // restart loops to re-shape immediately for new phase
    this.runId++;
    const myRun = this.runId;
    this.clearTimers();
    void this.loopBed(myRun);
    void this.loopEnvelope(myRun);
  }

  async stopAll() {
    this.running = false;
    this.runId++;
    this.clearTimers();
  }

  async dispose() {
    await this.stopAll();
  }

  // ---------- Scheduling ----------

  private clearTimers() {
    if (this.bedTimeout) clearTimeout(this.bedTimeout);
    if (this.envTimeout) clearTimeout(this.envTimeout);
    this.bedTimeout = null;
    this.envTimeout = null;
  }

  private baseBedIntervalMs(): number {
    // Baseline density by pattern
    switch (this.pattern) {
      case "gentle-wave":
        return 210;
      case "soft-pulse":
        return 185;
      case "standard":
      default:
        return 165;
    }
  }

  private phaseBedMultiplier(): number {
    if (this.phase === "peak") return 0.78;
    if (this.phase === "coolDown") return 1.15;
    return 1.0; // settle
  }

  private intensityBedMultiplier(): number {
    // higher intensity -> slightly denser
    const i = clamp01(this.settings.hapticsIntensity01);
    return lerp(1.22, 0.82, i);
  }

  private bedIntervalMs(): number {
    const ms =
      this.baseBedIntervalMs() *
      this.phaseBedMultiplier() *
      this.intensityBedMultiplier();

    // prevent pathological rates
    return Math.max(85, Math.min(320, Math.round(ms)));
  }

  private burstGroupPauseMs(): number {
    // How often we create a burst group
    // settle: slower, peak: faster, cool: slower
    const snap = clamp01(this.settings.snapDensity01);

    if (this.phase === "peak") return Math.round(lerp(420, 160, snap));
    if (this.phase === "coolDown") return Math.round(lerp(650, 380, snap));
    return Math.round(lerp(560, 280, snap)); // settle
  }

  private burstSnapsCount(): number {
    // snapDensity controls “how many snaps occur” during peak when peakStyle="snap"
    const snap = clamp01(this.settings.snapDensity01);
    return Math.round(lerp(2, 7, snap));
  }

  private chooseBedStyle(): Haptics.ImpactFeedbackStyle | "selection" {
    const i = clamp01(this.settings.hapticsIntensity01);

    if (this.phase === "coolDown") {
      if (i < 0.35) return "selection";
      return Haptics.ImpactFeedbackStyle.Soft;
    }

    if (this.phase === "settle") {
      if (i < 0.3) return "selection";
      if (i < 0.65) return Haptics.ImpactFeedbackStyle.Light;
      return Haptics.ImpactFeedbackStyle.Medium;
    }

    // peak
    if (this.settings.peakStyle === "max") {
      // your requirement: “Max” always mean 100% Heavy impacts + highest density
      return Haptics.ImpactFeedbackStyle.Heavy;
    }

    // snap peak: still strong, but feels “snappier”
    return i > 0.7
      ? Haptics.ImpactFeedbackStyle.Rigid
      : Haptics.ImpactFeedbackStyle.Heavy;
  }

  private chooseBurstStyle(): Haptics.ImpactFeedbackStyle {
    const i = clamp01(this.settings.hapticsIntensity01);

    if (this.phase === "coolDown") {
      return i > 0.6
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Soft;
    }

    if (this.phase === "settle") {
      return i > 0.7
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    }

    // peak
    if (this.settings.peakStyle === "max")
      return Haptics.ImpactFeedbackStyle.Heavy;
    return i > 0.7
      ? Haptics.ImpactFeedbackStyle.Rigid
      : Haptics.ImpactFeedbackStyle.Heavy;
  }

  private async loopBed(myRun: number) {
    if (!this.running || myRun !== this.runId) return;

    try {
      const bedStyle = this.chooseBedStyle();
      if (bedStyle === "selection") await Haptics.selectionAsync();
      else await Haptics.impactAsync(bedStyle);
    } catch {
      // ignore
    }

    if (!this.running || myRun !== this.runId) return;

    const next = this.bedIntervalMs();
    this.bedTimeout = setTimeout(() => void this.loopBed(myRun), next);
  }

  private async loopEnvelope(myRun: number) {
    if (!this.running || myRun !== this.runId) return;

    try {
      if (this.phase === "peak" && this.settings.peakStyle === "snap") {
        // SNAP mode: user controls “how many snaps occur”
        const snaps = this.burstSnapsCount();
        const style = this.chooseBurstStyle();

        for (let k = 0; k < snaps; k++) {
          if (!this.running || myRun !== this.runId) return;
          await Haptics.impactAsync(style);
          // snap spacing
          await new Promise((r) => setTimeout(r, 55));
        }
      } else {
        // MAX peak (or settle/cool): a small burst group (2–4 pulses)
        const style = this.chooseBurstStyle();
        const count =
          this.phase === "peak" ? 4 : this.phase === "settle" ? 3 : 2;

        for (let k = 0; k < count; k++) {
          if (!this.running || myRun !== this.runId) return;
          await Haptics.impactAsync(style);
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    } catch {
      // ignore
    }

    if (!this.running || myRun !== this.runId) return;

    const pause = this.burstGroupPauseMs();
    this.envTimeout = setTimeout(() => void this.loopEnvelope(myRun), pause);
  }
}
