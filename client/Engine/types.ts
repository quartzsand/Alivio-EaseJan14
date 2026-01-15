// client/engine/types.ts

export type Site =
  | "fingerstick"
  | "subq_abdomen"
  | "subq_thigh"
  | "subq_deltoid"
  | "im_deltoid"
  | "im_vastus_lateralis"
  | "im_ventrogluteal"
  | "im_dorsogluteal";

export type AgeGroup =
  | "infant"
  | "toddler"
  | "child"
  | "teen"
  | "adult"
  | "older_adult"
  | "obese_adult";

export type PeakStyle = "max" | "snap";

export type SessionDurationSec = 18 | 24 | 30;

export type PhaseName = "settle" | "peak" | "cooldown";

export type EngineCaps = {
  continuousHaptics: boolean; // Core Haptics
  paramCurves: boolean; // Core Haptics parameter automation
  audioMixing: boolean; // e.g., multiple tracks, ducking
  lowLatencyScheduling: boolean; // native scheduling
};

// Core-neutral “command” types.
// For Expo Haptics you’ll approximate these.
export type HapticCommand =
  | {
      tMs: number;
      type: "impact";
      style: "light" | "medium" | "heavy";
      intensity01: number;
    }
  | { tMs: number; type: "notification"; kind: "success" | "warning" | "error" }
  | { tMs: number; type: "pause"; durationMs: number }
  // Future: continuous + curves (native)
  | {
      tMs: number;
      type: "continuous";
      durationMs: number;
      intensity01: number;
      sharpness01: number;
    }
  | {
      tMs: number;
      type: "curve";
      param: "intensity" | "sharpness";
      points: Array<{ dtMs: number; v01: number }>;
    };

export type AudioCommand =
  | {
      tMs: number;
      type: "tone";
      freqHz: number;
      gain01: number;
      durationMs: number;
    }
  | {
      tMs: number;
      type: "track";
      id: "lofi" | "noise" | "rumble";
      gain01: number;
      action: "start" | "stop";
    }
  | { tMs: number; type: "volume"; gain01: number };

export type SessionPlan = {
  site: Site;
  ageGroup: AgeGroup;
  durationSec: SessionDurationSec;
  phases: Array<{ name: PhaseName; startMs: number; endMs: number }>;
  haptics: HapticCommand[];
  audio: AudioCommand[];
};
