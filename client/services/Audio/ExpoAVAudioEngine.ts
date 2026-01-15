// client/services/audio/ExpoAVAudioEngine.ts
import { Audio } from "expo-av";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// IMPORTANT: adjust path if your assets folder differs
const ENTRAIN_LOOP = require("../../assets/audio/entrain_loop.mp3");

export class ExpoAVAudioEngine {
  private loopSound: Audio.Sound | null = null;
  private initialized = false;
  private enabled = true;
  private volume01 = 0.6;

  async init() {
    if (this.initialized) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    this.initialized = true;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      // fire and forget
      void this.stopAll();
    }
  }

  async setVolume(volume01: number) {
    this.volume01 = clamp01(volume01);
    if (this.loopSound) {
      await this.loopSound.setVolumeAsync(this.volume01);
    }
  }

  async startLoop() {
    if (!this.enabled) return;
    await this.init();

    if (this.loopSound) return;

    const { sound } = await Audio.Sound.createAsync(ENTRAIN_LOOP, {
      isLooping: true,
      volume: this.volume01,
    });

    this.loopSound = sound;
    await sound.playAsync();
  }

  async getPositionMs(): Promise<number> {
    if (!this.loopSound) return 0;
    const status = await this.loopSound.getStatusAsync();
    return status.isLoaded ? status.positionMillis : 0;
  }

  async stopAll() {
    if (!this.loopSound) return;
    try {
      await this.loopSound.stopAsync();
    } finally {
      await this.loopSound.unloadAsync();
      this.loopSound = null;
    }
  }

  async dispose() {
    await this.stopAll();
    this.initialized = false;
  }
}
