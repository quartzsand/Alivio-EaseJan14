// client/engine/audio/ExpoAVAudioEngine.ts
import { Audio } from "expo-av";
import { AudioCommand, EngineCaps } from "../types";
import { AudioEngine } from "./AudioEngine";

export class ExpoAVAudioEngine implements AudioEngine {
  public readonly caps: EngineCaps = {
    continuousHaptics: false,
    paramCurves: false,
    audioMixing: true,
    lowLatencyScheduling: false,
  };

  private masterVol = 0.6;
  private lofiSound: Audio.Sound | null = null;

  async init() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
    });
  }

  async setMasterVolume(v01: number) {
    this.masterVol = Math.max(0, Math.min(1, v01));
    if (this.lofiSound) await this.lofiSound.setVolumeAsync(this.masterVol);
  }

  async schedule(commands: AudioCommand[]) {
    // Expo AV scheduling is coarse; we use JS timers.
    const t0 = Date.now();
    for (const cmd of commands) {
      setTimeout(
        () => this.apply(cmd).catch(() => {}),
        Math.max(0, cmd.tMs - (Date.now() - t0)),
      );
    }
  }

  private async apply(cmd: AudioCommand) {
    if (cmd.type === "track" && cmd.id === "lofi") {
      if (cmd.action === "start") {
        if (!this.lofiSound) {
          const { sound } = await Audio.Sound.createAsync(
            // TODO: replace with your asset path
            require("../../assets/audio/lofi.mp3"),
            {
              shouldPlay: true,
              isLooping: true,
              volume: this.masterVol * cmd.gain01,
            },
          );
          this.lofiSound = sound;
        } else {
          await this.lofiSound.setIsLoopingAsync(true);
          await this.lofiSound.setVolumeAsync(this.masterVol * cmd.gain01);
          await this.lofiSound.playAsync();
        }
      } else {
        if (this.lofiSound) await this.lofiSound.stopAsync();
      }
      return;
    }

    if (cmd.type === "volume") {
      await this.setMasterVolume(cmd.gain01);
      return;
    }

    // Tone/noise can be added later via generated PCM or native
  }

  async stopAll() {
    if (this.lofiSound) await this.lofiSound.stopAsync();
  }

  async dispose() {
    if (this.lofiSound) {
      await this.lofiSound.unloadAsync();
      this.lofiSound = null;
    }
  }
}
