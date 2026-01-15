// client/engine/haptics/ExpoHapticsEngine.ts
import * as Haptics from "expo-haptics";
import { EngineCaps, HapticCommand } from "../types";
import { HapticsEngine } from "./HapticsEngine";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export class ExpoHapticsEngine implements HapticsEngine {
  public readonly caps: EngineCaps = {
    continuousHaptics: false,
    paramCurves: false,
    audioMixing: false,
    lowLatencyScheduling: false,
  };

  private intensityScale = 1.0;
  private timeouts: Array<ReturnType<typeof setTimeout>> = [];

  async init() {
    // nothing required for expo-haptics
  }

  setIntensity(v01: number) {
    this.intensityScale = clamp01(v01);
  }

  async schedule(commands: HapticCommand[]) {
    const t0 = Date.now();
    for (const cmd of commands) {
      const handle = setTimeout(
        () => {
          this.apply(cmd).catch(() => {});
        },
        Math.max(0, cmd.tMs - (Date.now() - t0)),
      );
      this.timeouts.push(handle);
    }
  }

  private async apply(cmd: HapticCommand) {
    if (cmd.type === "impact") {
      // Expo doesn’t support sharpness/intensity; we approximate by density + style.
      // We’ll treat intensity01 as a multiplier for choosing heavier patterns.
      const scaled = clamp01(cmd.intensity01 * this.intensityScale);

      const style =
        scaled > 0.8
          ? Haptics.ImpactFeedbackStyle.Heavy
          : scaled > 0.45
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;

      await Haptics.impactAsync(style);
      return;
    }

    if (cmd.type === "notification") {
      const kind =
        cmd.kind === "success"
          ? Haptics.NotificationFeedbackType.Success
          : cmd.kind === "warning"
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Error;
      await Haptics.notificationAsync(kind);
      return;
    }

    // continuous/curve are ignored in Expo mode; they exist for future Core Haptics.
  }

  async stopAll() {
    // Cancel timers so future events don’t fire
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts = [];
  }

  async dispose() {
    await this.stopAll();
  }
}
