import { Audio, AVPlaybackStatus } from "expo-av";

export type SensoryProfile = 
  | "edge" 
  | "buffer" 
  | "deepwave" 
  | "rhythmiclayers";

export type TextureVariation = 
  | "constantflow" 
  | "rhythmicwaves" 
  | "adaptiveflow";

export type SessionDuration = 18 | 24 | 30;

export type TestProfile = 
  | "test_gate_control" 
  | "test_massage_simulation";

export interface AudioEngineConfig {
  masterVolume?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface PlaybackOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

// Static audio asset mapping - all 40 files
const AUDIO_ASSETS: Record<string, any> = {
  // Edge profile
  "edge-constantflow-18s": require("@/../assets/audio/sensory-tracks/edge-constantflow-18s.wav"),
  "edge-constantflow-24s": require("@/../assets/audio/sensory-tracks/edge-constantflow-24s.wav"),
  "edge-constantflow-30s": require("@/../assets/audio/sensory-tracks/edge-constantflow-30s.wav"),
  "edge-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/edge-rhythmicwaves-18s.wav"),
  "edge-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/edge-rhythmicwaves-24s.wav"),
  "edge-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/edge-rhythmicwaves-30s.wav"),
  "edge-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/edge-adaptiveflow-18s.wav"),
  "edge-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/edge-adaptiveflow-24s.wav"),
  "edge-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/edge-adaptiveflow-30s.wav"),
  
  // Buffer profile
  "buffer-constantflow-18s": require("@/../assets/audio/sensory-tracks/buffer-constantflow-18s.wav"),
  "buffer-constantflow-24s": require("@/../assets/audio/sensory-tracks/buffer-constantflow-24s.wav"),
  "buffer-constantflow-30s": require("@/../assets/audio/sensory-tracks/buffer-constantflow-30s.wav"),
  "buffer-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/buffer-rhythmicwaves-18s.wav"),
  "buffer-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/buffer-rhythmicwaves-24s.wav"),
  "buffer-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/buffer-rhythmicwaves-30s.wav"),
  "buffer-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/buffer-adaptiveflow-18s.wav"),
  "buffer-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/buffer-adaptiveflow-24s.wav"),
  "buffer-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/buffer-adaptiveflow-30s.wav"),
  
  // Deep Wave profile
  "deepwave-constantflow-18s": require("@/../assets/audio/sensory-tracks/deepwave-constantflow-18s.wav"),
  "deepwave-constantflow-24s": require("@/../assets/audio/sensory-tracks/deepwave-constantflow-24s.wav"),
  "deepwave-constantflow-30s": require("@/../assets/audio/sensory-tracks/deepwave-constantflow-30s.wav"),
  "deepwave-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/deepwave-rhythmicwaves-18s.wav"),
  "deepwave-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/deepwave-rhythmicwaves-24s.wav"),
  "deepwave-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/deepwave-rhythmicwaves-30s.wav"),
  "deepwave-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/deepwave-adaptiveflow-18s.wav"),
  "deepwave-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/deepwave-adaptiveflow-24s.wav"),
  "deepwave-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/deepwave-adaptiveflow-30s.wav"),
  
  // Rhythmic Layers profile
  "rhythmiclayers-constantflow-18s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-constantflow-18s.wav"),
  "rhythmiclayers-constantflow-24s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-constantflow-24s.wav"),
  "rhythmiclayers-constantflow-30s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-constantflow-30s.wav"),
  "rhythmiclayers-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-rhythmicwaves-18s.wav"),
  "rhythmiclayers-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-rhythmicwaves-24s.wav"),
  "rhythmiclayers-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-rhythmicwaves-30s.wav"),
  "rhythmiclayers-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-adaptiveflow-18s.wav"),
  "rhythmiclayers-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-adaptiveflow-24s.wav"),
  "rhythmiclayers-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-adaptiveflow-30s.wav"),
  
  // Test profiles
  "test_gate_control-18s": require("@/../assets/audio/test-profiles/test_gate_control-18s.wav"),
  "test_massage_simulation-30s": require("@/../assets/audio/test-profiles/test_massage_simulation-30s.wav"),
  
  // UI sounds
  "ui_start": require("@/../assets/audio/ui_start.wav"),
  "ui_complete": require("@/../assets/audio/ui_complete.wav"),
};

export class ExpoAVAudioEngine {
  private sound: Audio.Sound | null = null;
  private masterVolume: number = 0.8;
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error("ExpoAVAudioEngine init error:", error);
    }
  }

  async setMasterVolume(volume: number): Promise<void> {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.sound) {
      await this.sound.setVolumeAsync(this.masterVolume);
    }
  }

  async playSensoryTrack(
    profile: SensoryProfile,
    texture: TextureVariation,
    duration: SessionDuration,
    options?: PlaybackOptions
  ): Promise<void> {
    const key = `${profile}-${texture}-${duration}s`;
    const asset = AUDIO_ASSETS[key];
    
    if (!asset) {
      console.warn(`Audio track not found: ${key}`);
      return;
    }

    await this.playSound(asset, options);
  }

  async playTestProfile(profile: TestProfile, options?: PlaybackOptions): Promise<void> {
    const duration = profile === "test_gate_control" ? "18s" : "30s";
    const key = `${profile}-${duration}`;
    const asset = AUDIO_ASSETS[key];
    
    if (!asset) {
      console.warn(`Test profile not found: ${key}`);
      return;
    }

    await this.playSound(asset, options);
  }

  async playUISound(soundId: "ui_start" | "ui_complete"): Promise<void> {
    const asset = AUDIO_ASSETS[soundId];
    if (!asset) {
      console.warn(`UI sound not found: ${soundId}`);
      return;
    }

    // Play UI sounds at reduced volume, don't interrupt main audio
    const tempSound = new Audio.Sound();
    try {
      await tempSound.loadAsync(asset);
      await tempSound.setVolumeAsync(this.masterVolume * 0.7);
      await tempSound.playAsync();
      // Auto-unload after playing
      tempSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          tempSound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error playing UI sound:", error);
    }
  }

  private async playSound(asset: any, options?: PlaybackOptions): Promise<void> {
    await this.stopCurrentSound();

    try {
      this.sound = new Audio.Sound();
      await this.sound.loadAsync(asset);
      
      const volume = (options?.volume ?? 1) * this.masterVolume;
      await this.sound.setVolumeAsync(options?.fadeIn ? 0 : volume);
      await this.sound.setIsLoopingAsync(options?.loop ?? false);
      await this.sound.playAsync();

      if (options?.fadeIn) {
        this.fadeIn(volume, 1000);
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }

  private async fadeIn(targetVolume: number, durationMs: number): Promise<void> {
    if (!this.sound) return;
    
    const steps = 20;
    const stepTime = durationMs / steps;
    const volumeStep = targetVolume / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      if (this.sound) {
        await this.sound.setVolumeAsync(volumeStep * i);
      }
    }
  }

  async stopCurrentSound(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.sound = null;
    }
  }

  async pauseCurrentSound(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async resumeCurrentSound(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async getCurrentPosition(): Promise<number> {
    if (!this.sound) return 0;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return status.positionMillis;
      }
    } catch {}
    return 0;
  }

  async getDuration(): Promise<number> {
    if (!this.sound) return 0;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        return status.durationMillis;
      }
    } catch {}
    return 0;
  }

  async dispose(): Promise<void> {
    await this.stopCurrentSound();
    this.isInitialized = false;
  }

  // Static helpers
  static getAvailableProfiles(): SensoryProfile[] {
    return ["edge", "buffer", "deepwave", "rhythmiclayers"];
  }

  static getAvailableTextures(): TextureVariation[] {
    return ["constantflow", "rhythmicwaves", "adaptiveflow"];
  }

  static getAvailableDurations(): SessionDuration[] {
    return [18, 24, 30];
  }

  static getAvailableTestProfiles(): TestProfile[] {
    return ["test_gate_control", "test_massage_simulation"];
  }

  static getProfileDisplayName(profile: SensoryProfile): string {
    const names: Record<SensoryProfile, string> = {
      edge: "Edge",
      buffer: "Buffer", 
      deepwave: "Deep Wave",
      rhythmiclayers: "Rhythmic Layers",
    };
    return names[profile];
  }

  static getTextureDisplayName(texture: TextureVariation): string {
    const names: Record<TextureVariation, string> = {
      constantflow: "Constant Flow",
      rhythmicwaves: "Rhythmic Waves",
      adaptiveflow: "Adaptive Flow",
    };
    return names[texture];
  }

  static getTestProfileDisplayName(profile: TestProfile): string {
    const names: Record<TestProfile, string> = {
      test_gate_control: "Gate Control Test",
      test_massage_simulation: "Massage Simulation Test",
    };
    return names[profile];
  }
}

// Export singleton instance
export const audioEngine = new ExpoAVAudioEngine();
