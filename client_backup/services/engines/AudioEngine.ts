export type AudioCommand =
  | { tMs: number; type: "lofi"; action: "start" | "stop"; gain01: number }
  | { tMs: number; type: "volume"; gain01: number };

export interface AudioEngine {
  init(): Promise<void>;
  setMasterVolume(v01: number): Promise<void>;
  schedule(commands: AudioCommand[]): Promise<void>;
  stopAll(): Promise<void>;
}
