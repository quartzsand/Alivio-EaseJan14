// client/services/SensoryService.ts
import { ExpoAVAudioEngine } from "@/services/audio/ExpoAVAudioEngine";
import {
  ExpoHapticsEngine,
  type SensorySettings,
  type SessionPhase,
} from "@/services/engines/ExpoHapticsEngine";
import type { HapticPattern } from "@/types";

export type SensoryStartArgs = {
  pattern: HapticPattern;
  phase: SessionPhase;

  audioEnabled: boolean;

  hapticsIntensity01: number;
  audioVolume01: number;

  peakStyle: "max" | "snap";
  snapDensity01: number;

  useAdvancedHaptics: boolean;
};

class SensoryService {
  private initialized = false;

  private engines: {
    audio: ExpoAVAudioEngine;
    haptics: ExpoHapticsEngine | any;
  } | null = null;

  private async initIfNeeded(settings: SensorySettings) {
    if (this.initialized && this.engines) return;

    const audio = new ExpoAVAudioEngine();

    // Default engine
    let haptics: any = new ExpoHapticsEngine();

    // Future upgrade path (native): try -> fallback
    if (settings.useAdvancedHaptics) {
      try {
        const mod = require("./engines/CoreHapticsEngine");
        haptics = new mod.CoreHapticsEngine();
      } catch {
        haptics = new ExpoHapticsEngine();
      }
    }

    await audio.init();
    await haptics.init();

    haptics.setIntensity(settings.hapticsIntensity01);
    await audio.setVolume(settings.audioVolume01);

    this.engines = { audio, haptics };
    this.initialized = true;
  }

  async startSession(args: SensoryStartArgs) {
    const settings: SensorySettings = {
      useAdvancedHaptics: !!args.useAdvancedHaptics,
      hapticsIntensity01: args.hapticsIntensity01,
      audioVolume01: args.audioVolume01,
      peakStyle: args.peakStyle,
      snapDensity01: args.snapDensity01,
    };

    await this.initIfNeeded(settings);
    if (!this.engines) return;

    // AUDIO: exact methods from ExpoAVAudioEngine
    this.engines.audio.setEnabled(!!args.audioEnabled);
    await this.engines.audio.setVolume(args.audioVolume01);
    if (args.audioEnabled) {
      await this.engines.audio.startLoop();
    } else {
      await this.engines.audio.stopAll();
    }

    // HAPTICS
    this.engines.haptics.setIntensity(args.hapticsIntensity01);
    await this.engines.haptics.start(args.pattern, args.phase, settings);
  }

  updatePhase(phase: SessionPhase) {
    if (!this.engines) return;
    this.engines.haptics.updatePhase(phase);
  }

  async getMusicPositionMs() {
    if (!this.engines) return 0;
    return await this.engines.audio.getPositionMs();
  }

  async stop() {
    if (!this.engines) return;
    await this.engines.haptics.stopAll();
    await this.engines.audio.stopAll();
  }

  async dispose() {
    if (!this.engines) return;
    await this.engines.haptics.dispose();
    await this.engines.audio.dispose();
    this.engines = null;
    this.initialized = false;
  }
}

export const sensoryService = new SensoryService();
