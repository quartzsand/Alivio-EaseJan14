export type HapticCommand =
  | { tMs: number; type: "impact"; style: "light" | "medium" | "heavy" }
  | { tMs: number; type: "pause"; durationMs: number };

export interface HapticsEngine {
  init(): Promise<void>;
  setIntensity(v01: number): void;     // global scaling
  schedule(commands: HapticCommand[]): Promise<void>;
  stopAll(): Promise<void>;
}
