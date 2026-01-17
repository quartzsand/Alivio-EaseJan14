import * as Haptics from "expo-haptics";
import type { HapticPattern } from "@/types";

export type PeakStyle = "max" | "snap";

export type SensorySettings = {
  useAdvancedHaptics: boolean;
  hapticsIntensity01: number;
  peakStyle: PeakStyle;
  snapDensity01: number;
  audioVolume01: number;
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

  private clearTimers() {
    if (this.bedTimeout) clearTimeout(this.bedTimeout);
    if (this.envTimeout) clearTimeout(this.envTimeout);
    this.bedTimeout = null;
    this.envTimeout = null;
  }

  private baseBedIntervalMs(): number {
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
    return 1.0;
  }

  private intensityBedMultiplier(): number {
    const i = clamp01(this.settings.hapticsIntensity01);
    return lerp(1.22, 0.82, i);
  }

  private bedIntervalMs(): number {
    const ms =
      this.baseBedIntervalMs() *
      this.phaseBedMultiplier() *
      this.intensityBedMultiplier();
    return Math.max(85, Math.min(320, Math.round(ms)));
  }

  private burstGroupPauseMs(): number {
    const snap = clamp01(this.settings.snapDensity01);
    if (this.phase === "peak") return Math.round(lerp(420, 160, snap));
    if (this.phase === "coolDown") return Math.round(lerp(650, 380, snap));
    return Math.round(lerp(560, 280, snap));
  }

  private burstSnapsCount(): number {
    const snap = clamp01(this.settings.snapDensity01);
    return Math.round(lerp(2, 7, snap));
  }

  private chooseBedStyle(): Haptics.ImpactFeedbackStyle | "selection" {
    const i = clamp01(this.settings.hapticsIntensity01);
    if (this.phase === "coolDown")
      return i < 0.35 ? "selection" : Haptics.ImpactFeedbackStyle.Soft;
    if (this.phase === "settle") {
      if (i < 0.3) return "selection";
      if (i < 0.65) return Haptics.ImpactFeedbackStyle.Light;
      return Haptics.ImpactFeedbackStyle.Medium;
    }
    return Haptics.ImpactFeedbackStyle.Heavy;
  }

  private chooseBurstStyle(): Haptics.ImpactFeedbackStyle {
    const i = clamp01(this.settings.hapticsIntensity01);
    if (this.phase === "coolDown")
      return i > 0.6
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Soft;
    if (this.phase === "settle")
      return i > 0.7
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    if (this.settings.peakStyle === "max")
      return Haptics.ImpactFeedbackStyle.Heavy;
    return i > 0.7
      ? Haptics.ImpactFeedbackStyle.Rigid
      : Haptics.ImpactFeedbackStyle.Heavy;
  }

  private async loopBed(myRun: number) {
    if (!this.running || myRun !== this.runId) return;
    try {
      const style = this.chooseBedStyle();
      style === "selection"
        ? await Haptics.selectionAsync()
        : await Haptics.impactAsync(style);
    } catch {}
    if (!this.running || myRun !== this.runId) return;
    this.bedTimeout = setTimeout(
      () => void this.loopBed(myRun),
      this.bedIntervalMs(),
    );
  }

  private async loopEnvelope(myRun: number) {
    if (!this.running || myRun !== this.runId) return;
    try {
      if (this.phase === "peak" && this.settings.peakStyle === "snap") {
        const snaps = this.burstSnapsCount();
        const style = this.chooseBurstStyle();
        for (let k = 0; k < snaps; k++) {
          if (!this.running || myRun !== this.runId) return;
          await Haptics.impactAsync(style);
          await new Promise((r) => setTimeout(r, 55));
        }
      } else {
        const style = this.chooseBurstStyle();
        const count =
          this.phase === "peak" ? 4 : this.phase === "settle" ? 3 : 2;
        for (let k = 0; k < count; k++) {
          if (!this.running || myRun !== this.runId) return;
          await Haptics.impactAsync(style);
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    } catch {}
    if (!this.running || myRun !== this.runId) return;
    this.envTimeout = setTimeout(
      () => void this.loopEnvelope(myRun),
      this.burstGroupPauseMs(),
    );
  }
}
