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

const AUDIO_ASSETS: Record<string, any> = {
  "edge-constantflow-18s": require("@/../assets/audio/sensory-tracks/edge-constantflow-18s.wav"),
  "edge-constantflow-24s": require("@/../assets/audio/sensory-tracks/edge-constantflow-24s.wav"),
  "edge-constantflow-30s": require("@/../assets/audio/sensory-tracks/edge-constantflow-30s.wav"),
  "edge-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/edge-rhythmicwaves-18s.wav"),
  "edge-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/edge-rhythmicwaves-24s.wav"),
  "edge-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/edge-rhythmicwaves-30s.wav"),
  "edge-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/edge-adaptiveflow-18s.wav"),
  "edge-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/edge-adaptiveflow-24s.wav"),
  "edge-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/edge-adaptiveflow-30s.wav"),
  "buffer-constantflow-18s": require("@/../assets/audio/sensory-tracks/buffer-constantflow-18s.wav"),
  "buffer-constantflow-24s": require("@/../assets/audio/sensory-tracks/buffer-constantflow-24s.wav"),
  "buffer-constantflow-30s": require("@/../assets/audio/sensory-tracks/buffer-constantflow-30s.wav"),
  "buffer-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/buffer-rhythmicwaves-18s.wav"),
  "buffer-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/buffer-rhythmicwaves-24s.wav"),
  "buffer-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/buffer-rhythmicwaves-30s.wav"),
  "buffer-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/buffer-adaptiveflow-18s.wav"),
  "buffer-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/buffer-adaptiveflow-24s.wav"),
  "buffer-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/buffer-adaptiveflow-30s.wav"),
  "deepwave-constantflow-18s": require("@/../assets/audio/sensory-tracks/deepwave-constantflow-18s.wav"),
  "deepwave-constantflow-24s": require("@/../assets/audio/sensory-tracks/deepwave-constantflow-24s.wav"),
  "deepwave-constantflow-30s": require("@/../assets/audio/sensory-tracks/deepwave-constantflow-30s.wav"),
  "deepwave-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/deepwave-rhythmicwaves-18s.wav"),
  "deepwave-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/deepwave-rhythmicwaves-24s.wav"),
  "deepwave-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/deepwave-rhythmicwaves-30s.wav"),
  "deepwave-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/deepwave-adaptiveflow-18s.wav"),
  "deepwave-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/deepwave-adaptiveflow-24s.wav"),
  "deepwave-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/deepwave-adaptiveflow-30s.wav"),
  "rhythmiclayers-constantflow-18s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-constantflow-18s.wav"),
  "rhythmiclayers-constantflow-24s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-constantflow-24s.wav"),
  "rhythmiclayers-constantflow-30s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-constantflow-30s.wav"),
  "rhythmiclayers-rhythmicwaves-18s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-rhythmicwaves-18s.wav"),
  "rhythmiclayers-rhythmicwaves-24s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-rhythmicwaves-24s.wav"),
  "rhythmiclayers-rhythmicwaves-30s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-rhythmicwaves-30s.wav"),
  "rhythmiclayers-adaptiveflow-18s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-adaptiveflow-18s.wav"),
  "rhythmiclayers-adaptiveflow-24s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-adaptiveflow-24s.wav"),
  "rhythmiclayers-adaptiveflow-30s": require("@/../assets/audio/sensory-tracks/rhythmiclayers-adaptiveflow-30s.wav"),
  "test_gate_control-18s": require("@/../assets/audio/test-profiles/test_gate_control-18s.wav"),
  "test_massage_simulation-30s": require("@/../assets/audio/test-profiles/test_massage_simulation-30s.wav"),
  "ui_start": require("@/../assets/audio/ui_start.mp3"),
  "ui_complete": require("@/../assets/audio/ui_complete.mp3"),
};

export class ExpoAVAudioEngine {
  private masterVolume: number = 0.7;
  private fadeInMs: number = 500;
  private fadeOutMs: number = 500;
  private currentSound: Audio.Sound | null = null;
  private uiSounds: Map<string, Audio.Sound> = new Map();
  private isInitialized: boolean = false;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config?: AudioEngineConfig) {
    if (config?.masterVolume !== undefined) {
      this.masterVolume = Math.max(0, Math.min(1, config.masterVolume));
    }
    if (config?.fadeInMs !== undefined) {
      this.fadeInMs = config.fadeInMs;
    }
    if (config?.fadeOutMs !== undefined) {
      this.fadeOutMs = config.fadeOutMs;
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn("ExpoAVAudioEngine: Failed to initialize audio mode", error);
    }
  }

  async setMasterVolume(volume: number): Promise<void> {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.currentSound) {
      await this.currentSound.setVolumeAsync(this.masterVolume);
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  private getTrackKey(
    profile: SensoryProfile,
    texture: TextureVariation,
    duration: SessionDuration
  ): string {
    return `${profile}-${texture}-${duration}s`;
  }

  private getTestTrackKey(profile: TestProfile): string {
    const durations: Record<TestProfile, number> = {
      test_gate_control: 18,
      test_massage_simulation: 30,
    };
    return `${profile}-${durations[profile]}s`;
  }

  async playSensoryTrack(
    profile: SensoryProfile,
    texture: TextureVariation,
    duration: SessionDuration,
    options?: PlaybackOptions
  ): Promise<void> {
    await this.init();
    await this.stopCurrentSound();

    const key = this.getTrackKey(profile, texture, duration);
    const asset = AUDIO_ASSETS[key];

    if (!asset) {
      console.warn(`ExpoAVAudioEngine: Track not found: ${key}`);
      return;
    }

    try {
      const volume = (options?.volume ?? 1) * this.masterVolume;
      const initialVolume = options?.fadeIn ? 0 : volume;

      const { sound } = await Audio.Sound.createAsync(asset, {
        shouldPlay: true,
        isLooping: options?.loop ?? false,
        volume: initialVolume,
      });

      this.currentSound = sound;

      if (options?.fadeIn) {
        await this.fadeIn(sound, volume, this.fadeInMs);
      }

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish && !options?.loop) {
          this.handlePlaybackComplete();
        }
      });
    } catch (error) {
      console.warn(`ExpoAVAudioEngine: Failed to play track ${key}`, error);
    }
  }

  async playTestProfile(
    profile: TestProfile,
    options?: PlaybackOptions
  ): Promise<void> {
    await this.init();
    await this.stopCurrentSound();

    const key = this.getTestTrackKey(profile);
    const asset = AUDIO_ASSETS[key];

    if (!asset) {
      console.warn(`ExpoAVAudioEngine: Test profile not found: ${key}`);
      return;
    }

    try {
      const volume = (options?.volume ?? 1) * this.masterVolume;
      const initialVolume = options?.fadeIn ? 0 : volume;

      const { sound } = await Audio.Sound.createAsync(asset, {
        shouldPlay: true,
        isLooping: options?.loop ?? false,
        volume: initialVolume,
      });

      this.currentSound = sound;

      if (options?.fadeIn) {
        await this.fadeIn(sound, volume, this.fadeInMs);
      }

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish && !options?.loop) {
          this.handlePlaybackComplete();
        }
      });
    } catch (error) {
      console.warn(`ExpoAVAudioEngine: Failed to play test profile ${key}`, error);
    }
  }

  async playUISound(soundId: "ui_start" | "ui_complete"): Promise<void> {
    await this.init();

    const asset = AUDIO_ASSETS[soundId];
    if (!asset) return;

    try {
      let sound = this.uiSounds.get(soundId);
      
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(asset, {
          shouldPlay: false,
          volume: this.masterVolume * 0.5,
        });
        sound = newSound;
        this.uiSounds.set(soundId, sound);
      }

      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.warn(`ExpoAVAudioEngine: Failed to play UI sound ${soundId}`, error);
    }
  }

  private async fadeIn(
    sound: Audio.Sound,
    targetVolume: number,
    durationMs: number
  ): Promise<void> {
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = targetVolume / steps;

    let currentStep = 0;

    return new Promise((resolve) => {
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        const newVolume = Math.min(targetVolume, volumeStep * currentStep);
        
        try {
          await sound.setVolumeAsync(newVolume);
        } catch {}

        if (currentStep >= steps) {
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          resolve();
        }
      }, stepDuration);
    });
  }

  private async fadeOut(
    sound: Audio.Sound,
    durationMs: number
  ): Promise<void> {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;

    const startVolume = status.volume;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = startVolume / steps;

    let currentStep = 0;

    return new Promise((resolve) => {
      this.fadeInterval = setInterval(async () => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - volumeStep * currentStep);
        
        try {
          await sound.setVolumeAsync(newVolume);
        } catch {}

        if (currentStep >= steps) {
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          resolve();
        }
      }, stepDuration);
    });
  }

  async stopCurrentSound(fadeOut: boolean = true): Promise<void> {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.currentSound) {
      try {
        if (fadeOut) {
          await this.fadeOut(this.currentSound, this.fadeOutMs);
        }
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch {}
      this.currentSound = null;
    }
  }

  async pauseCurrentSound(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.pauseAsync();
      } catch {}
    }
  }

  async resumeCurrentSound(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.playAsync();
      } catch {}
    }
  }

  async getCurrentPosition(): Promise<number> {
    if (this.currentSound) {
      try {
        const status = await this.currentSound.getStatusAsync();
        if (status.isLoaded) {
          return status.positionMillis;
        }
      } catch {}
    }
    return 0;
  }

  async getDuration(): Promise<number> {
    if (this.currentSound) {
      try {
        const status = await this.currentSound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          return status.durationMillis;
        }
      } catch {}
    }
    return 0;
  }

  isPlaying(): boolean {
    return this.currentSound !== null;
  }

  private handlePlaybackComplete(): void {
    this.currentSound = null;
  }

  async dispose(): Promise<void> {
    await this.stopCurrentSound(false);

    for (const sound of this.uiSounds.values()) {
      try {
        await sound.unloadAsync();
      } catch {}
    }
    this.uiSounds.clear();
    this.isInitialized = false;
  }

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
      test_gate_control: "Test A: Sharp Pain Relief",
      test_massage_simulation: "Test B: Deep Comfort",
    };
    return names[profile];
  }
}

export const audioEngine = new ExpoAVAudioEngine();
