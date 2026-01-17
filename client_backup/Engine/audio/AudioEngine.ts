// client/engine/audio/AudioEngine.ts
import { AudioCommand, EngineCaps } from "../types";

export interface AudioEngine {
  readonly caps: EngineCaps;
  init(): Promise<void>;
  setMasterVolume(v01: number): Promise<void>;
  schedule(commands: AudioCommand[]): Promise<void>;
  stopAll(): Promise<void>;
  dispose(): Promise<void>;
}
