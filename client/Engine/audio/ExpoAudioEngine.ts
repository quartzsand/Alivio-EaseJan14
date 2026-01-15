import { Audio } from "expo-av";
import { AudioEngine, AudioCommand } from "./AudioEngine";

export class ExpoAudioEngine implements AudioEngine {
  private master = 0.6;
  private lofi: Audio.Sound | null = null;

  async init() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
    });
  }

  async setMasterVolume(v01: number) {
    this.master = Math.max(0, Math.min(1, v01));
    if (this.lofi) await this.lofi.setVolumeAsync(this.master);
  }

  async schedule(commands: AudioCommand[]) {
    const t0 = Date.now();
    for (const cmd of commands) {
      setTimeout(() => this.apply(cmd).catch(() => {}), Math.max(0, cmd.tMs - (Date.now() - t0)));
    }
  }

  private async apply(cmd: AudioCommand) {
    if (cmd.type === "volume") return this.setMasterVolume(cmd.gain01);

    if (cmd.type === "lofi") {
      if (cmd.action === "start") {
        if (!this.lofi) {
          const { sound } = await Audio.Sound.createAsync(
            require("../../../assets/audio/lofi.mp3"),
            { shouldPlay: true, isLooping: true, volume: this.master * cmd.gain01 }
          );
          this.lofi = sound;
        } else {
          await this.lofi.setIsLoopingAsync(true);
          await this.lofi.setVolumeAsync(this.master * cmd.gain01);
          await this.lofi.playAsync();
        }
      } else {
        if (this.lofi) await this.lofi.stopAsync();
      }
    }
  }

  async stopAll() {
    if (this.lofi) await this.lofi.stopAsync();
  }
}
