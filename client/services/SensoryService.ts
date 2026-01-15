// client/services/SensoryService.ts
import { HapticsService } from "@/services/HapticsService";
import { ExpoAVAudioEngine } from "@/services/audio/ExpoAVAudioEngine";
import type { HapticPattern, SessionSite, SessionDuration } from "@/types";

type PeakStyle = "max" | "snap";

export type SensorySessionConfig = {
  pattern: HapticPattern;
  site?: SessionSite;
  duration?: SessionDuration;

  // user prefs
  hapticsIntensity01: number; // overall scaler
  peakStyle: PeakStyle; // "max" or "snap"
  snapDensity01: number; // used if peakStyle="snap"
  audioEnabled: boolean;
  audioVolume01: number;
};

class SensoryService {
  private audio = new ExpoAVAudioEngine();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    await this.audio.init();

    // If your HapticsService has an init, call it safely:
    // (If it doesn't, no harm.)
    const anyH = HapticsService as any;
    if (typeof anyH.init === "function") {
      await anyH.init();
    }

    this.initialized = true;
  }

  async startSession(cfg: SensorySessionConfig) {
    await this.init();

    // AUDIO
    this.audio.setEnabled(cfg.audioEnabled);
    await this.audio.setVolume(cfg.audioVolume01);
    if (cfg.audioEnabled) {
      await this.audio.startLoop();
    }

    // HAPTICS
    // Delegate to your existing implementation.
    // You likely already have a "guided session" API; if not, we can map it.
    const anyH = HapticsService as any;

    // Preferred: a single call that runs the full 12/6/6 (or 18/24/30) session.
    if (typeof anyH.playGuidedSession === "function") {
      await anyH.playGuidedSession({
        pattern: cfg.pattern,
        site: cfg.site,
        duration: cfg.duration,
        intensity01: cfg.hapticsIntensity01,
        peakStyle: cfg.peakStyle,
        snapDensity01: cfg.snapDensity01,
      });
      return;
    }

    // Fallback: if your HapticsService only knows "startPattern"
    if (typeof anyH.startPattern === "function") {
      await anyH.startPattern(cfg.pattern, cfg.hapticsIntensity01);
      return;
    }

    throw new Error(
      "HapticsService is missing playGuidedSession() and startPattern(). Add one of these to proceed.",
    );
  }

  async stop() {
    // stop haptics
    const anyH = HapticsService as any;
    if (typeof anyH.stopAll === "function") await anyH.stopAll();
    else if (typeof anyH.stop === "function") await anyH.stop();
    else if (typeof anyH.cleanup === "function") await anyH.cleanup();

    // stop audio
    await this.audio.stopAll();
  }

  async dispose() {
    const anyH = HapticsService as any;
    if (typeof anyH.dispose === "function") await anyH.dispose();
    await this.audio.dispose();
    this.initialized = false;
  }

  async getMusicPositionMs() {
    return this.audio.getPositionMs();
  }
}

export const sensoryService = new SensoryService();
