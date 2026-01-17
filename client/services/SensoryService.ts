// client/services/SensoryService.ts
// RECONCILED: Integrates ExpoHapticsEngine + ExpoAVAudioEngine with phase management
import { ExpoHapticsEngine, PeakStyle, SensorySettings } from "./engines/ExpoHapticsEngine";
import {
  ExpoAVAudioEngine,
  SensoryProfile,
  TextureVariation,
  SessionDuration,
  TestProfile,
  audioEngine,
} from "./audio/ExpoAVAudioEngine";
import type { HapticPattern } from "@/types";

type Phase = "settle" | "peak" | "coolDown";

export interface SessionStartOptions {
  pattern: HapticPattern;
  phase?: Phase;
  audioEnabled: boolean;
  hapticsIntensity01: number;
  audioVolume01: number;
  peakStyle: PeakStyle;
  snapDensity01: number;
  useAdvancedHaptics: boolean;
  sensoryProfile?: SensoryProfile;
  textureVariation?: TextureVariation;
  sessionDuration?: SessionDuration;
}

export class SensoryService {
  private hapticsEngine: ExpoHapticsEngine;
  private audioEngine: ExpoAVAudioEngine;
  private isRunning: boolean = false;
  private currentPhase: Phase | "idle" = "idle";

  constructor() {
    this.hapticsEngine = new ExpoHapticsEngine();
    this.audioEngine = audioEngine;
  }

  async init(): Promise<void> {
    await this.hapticsEngine.init();
    await this.audioEngine.init();
  }

  async startSession(options: SessionStartOptions): Promise<void> {
    const {
      pattern,
      phase = "settle",
      audioEnabled,
      hapticsIntensity01,
      audioVolume01,
      peakStyle,
      snapDensity01,
      useAdvancedHaptics,
      sensoryProfile = "edge",
      textureVariation = "constantflow",
      sessionDuration = 24,
    } = options;

    this.isRunning = true;
    this.currentPhase = phase;

    const settings: SensorySettings = {
      useAdvancedHaptics,
      hapticsIntensity01,
      peakStyle,
      snapDensity01,
      audioVolume01,
    };

    // Start haptics engine
    await this.hapticsEngine.start(pattern, phase, settings);

    // Start audio if enabled
    if (audioEnabled) {
      await this.audioEngine.setMasterVolume(audioVolume01);
      await this.audioEngine.playSensoryTrack(
        sensoryProfile,
        textureVariation,
        sessionDuration,
        { fadeIn: true, loop: false }
      );
    }
  }

  async startTestProfile(
    testProfile: TestProfile,
    options: Omit<SessionStartOptions, "sensoryProfile" | "textureVariation" | "sessionDuration">
  ): Promise<void> {
    const {
      pattern,
      phase = "settle",
      audioEnabled,
      hapticsIntensity01,
      audioVolume01,
      peakStyle,
      snapDensity01,
      useAdvancedHaptics,
    } = options;

    this.isRunning = true;
    this.currentPhase = phase;

    const settings: SensorySettings = {
      useAdvancedHaptics,
      hapticsIntensity01,
      peakStyle,
      snapDensity01,
      audioVolume01,
    };

    // Start haptics engine
    await this.hapticsEngine.start(pattern, phase, settings);

    // Start test profile audio if enabled
    if (audioEnabled) {
      await this.audioEngine.setMasterVolume(audioVolume01);
      await this.audioEngine.playTestProfile(testProfile, { fadeIn: true });
    }
  }

  updatePhase(phase: Phase): void {
    if (!this.isRunning) return;
    this.currentPhase = phase;
    this.hapticsEngine.updatePhase(phase);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.currentPhase = "idle";
    await this.hapticsEngine.stopAll();
    await this.audioEngine.stopCurrentSound();
  }

  async pause(): Promise<void> {
    await this.hapticsEngine.stopAll();
    await this.audioEngine.pauseCurrentSound();
  }

  async resume(): Promise<void> {
    await this.audioEngine.resumeCurrentSound();
    // Note: Haptics would need to be restarted with current settings
  }

  async getMusicPositionMs(): Promise<number> {
    return this.audioEngine.getCurrentPosition();
  }

  async getMusicDurationMs(): Promise<number> {
    return this.audioEngine.getDuration();
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getCurrentPhase(): Phase | "idle" {
    return this.currentPhase;
  }

  async playUISound(soundId: "ui_start" | "ui_complete"): Promise<void> {
    await this.audioEngine.playUISound(soundId);
  }

  async dispose(): Promise<void> {
    await this.stop();
    await this.hapticsEngine.dispose();
    await this.audioEngine.dispose();
  }

  // Static helpers for profile information
  static getAvailableProfiles(): SensoryProfile[] {
    return ExpoAVAudioEngine.getAvailableProfiles();
  }

  static getAvailableTextures(): TextureVariation[] {
    return ExpoAVAudioEngine.getAvailableTextures();
  }

  static getAvailableDurations(): SessionDuration[] {
    return ExpoAVAudioEngine.getAvailableDurations();
  }

  static getAvailableTestProfiles(): TestProfile[] {
    return ExpoAVAudioEngine.getAvailableTestProfiles();
  }

  static getProfileDisplayName(profile: SensoryProfile): string {
    return ExpoAVAudioEngine.getProfileDisplayName(profile);
  }

  static getTextureDisplayName(texture: TextureVariation): string {
    return ExpoAVAudioEngine.getTextureDisplayName(texture);
  }

  static getTestProfileDisplayName(profile: TestProfile): string {
    return ExpoAVAudioEngine.getTestProfileDisplayName(profile);
  }
}

// Export singleton instance
export const sensoryService = new SensoryService();
