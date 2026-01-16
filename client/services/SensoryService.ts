// client/services/SensoryService.ts
import type { HapticPattern } from "@/types";
import { ExpoAVAudioEngine } from "@/services/audio/ExpoAVAudioEngine";
import {
  ExpoHapticsEngine,
  SensorySettings,
} from "@/services/engines/ExpoHapticsEngine";

type Phase = "settle" | "peak" | "coolDown";

export class SensoryService {
  private audio = new ExpoAVAudioEngine();
  private haptics = new ExpoHapticsEngine();

  private initialized = false;
  private running = false;

  private lastPattern: HapticPattern = "standard";
  private lastSettings: SensorySettings = {
    useAdvancedHaptics: false,
    hapticsIntensity01: 0.85,
    peakStyle: "max",
    snapDensity01: 0.5,
    audioVolume01: 0.6,
  };

  async initIfNeeded() {
    if (this.initialized) return;
    await this.audio.init();
    await this.haptics.init();
    this.initialized = true;
  }

  async startSession(args: {
    pattern: HapticPattern;
    phase: "settle" | "peak" | "coolDown";
    audioEnabled: boolean;

    hapticsIntensity01: number;
    audioVolume01: number;

    peakStyle: "max" | "snap";
    snapDensity01: number;

    useAdvancedHaptics: boolean;
  }) {
    await this.initIfNeeded();

    const settings: SensorySettings = {
      useAdvancedHaptics: !!args.useAdvancedHaptics,
      hapticsIntensity01: args.hapticsIntensity01,
      peakStyle: args.peakStyle,
      snapDensity01: args.snapDensity01,
      audioVolume01: args.audioVolume01,
    };

    this.lastPattern = args.pattern;
    this.lastSettings = settings;

    // Audio
    this.audio.setEnabled(args.audioEnabled);
    await this.audio.setVolume(args.audioVolume01);
    if (args.audioEnabled) await this.audio.startLoop();
    else await this.audio.stopAll();

    // Haptics
    this.haptics.setIntensity(args.hapticsIntensity01);
    await this.haptics.start(args.pattern, args.phase, settings);

    this.running = true;
  }

  updatePhase(phase: Phase) {
    if (!this.running) return;
    this.haptics.updatePhase(phase);
  }

  async getMusicPositionMs(): Promise<number> {
    return this.audio.getPositionMs();
  }

  async stop() {
    this.running = false;
    await this.haptics.stopAll();
    await this.audio.stopAll();
  }

  async dispose() {
    await this.stop();
    await this.haptics.dispose();
    await this.audio.dispose();
    this.initialized = false;
  }
}

export const sensoryService = new SensoryService();
