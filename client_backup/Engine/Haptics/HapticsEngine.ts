// client/engine/haptics/HapticsEngine.ts
import { EngineCaps, HapticCommand } from "../types";

export interface HapticsEngine {
  readonly caps: EngineCaps;
  init(): Promise<void>;
  setIntensity(v01: number): void; // apply global scaling, does not need async
  schedule(commands: HapticCommand[]): Promise<void>;
  stopAll(): Promise<void>;
  dispose(): Promise<void>;
}
