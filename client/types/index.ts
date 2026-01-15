export type HapticPattern = 'standard' | 'gentle-wave' | 'soft-pulse';

export type ComfortRating = 1 | 2 | 3 | 4 | 5;

export type SessionSite = 
  | 'arm-left' 
  | 'arm-right' 
  | 'thigh-left' 
  | 'thigh-right' 
  | 'abdomen-left' 
  | 'abdomen-right'
  | 'other';

export type SessionDuration = 18 | 24 | 30;

export type PeakStyle = 'max' | 'snap';

export interface SessionPhases {
  settle: number;
  peak: number;
  cool: number;
}

export const SESSION_PHASE_PRESETS: Record<SessionDuration, SessionPhases> = {
  18: { settle: 9, peak: 5, cool: 4 },
  24: { settle: 12, peak: 6, cool: 6 },
  30: { settle: 15, peak: 8, cool: 7 },
};

export interface SessionLog {
  id: string;
  date: string;
  duration: number;
  hapticPattern: HapticPattern;
  comfortRating: ComfortRating;
  site?: SessionSite;
  notes?: string;
}

export interface SiteTuning {
  hapticIntensity: number;
  snapDensity: number;
  peakStyle: PeakStyle;
  audioVolume: number;
}

export interface UserPreferences {
  displayName: string;
  hapticIntensity: number;
  audioEnabled: boolean;
  audioVolume: number;
  avatarId: string;
  dragonflyVariant: 'blue' | 'white';
  theme: 'light' | 'dark' | 'auto';
  debugMode: boolean;
  peakStyle: PeakStyle;
  snapDensity: number;
  selectedDuration: SessionDuration;
  lastSelectedSite?: SessionSite;
  siteTunings: Partial<Record<SessionSite, SiteTuning>>;
  discoveryCompleted: boolean;

    useAdvancedHaptics?: boolean;  // default false
    peakStyle?: "max" | "snap";
    snapDensity01?: number;
    hapticsIntensity01?: number;   // if you aren’t already using it
    audioVolume01?: number;
    debugEnabled?: boolean;        // if you already have it, keep one canonical field
  }
}

export interface OnboardingState {
  completed: boolean;
  disclaimerAccepted: boolean;
  age: number | null;
  parentalConsentGiven: boolean;
}

export interface AppState {
  onboarding: OnboardingState;
  preferences: UserPreferences;
  sessions: SessionLog[];
}

export const COMFORT_LABELS: Record<ComfortRating, string> = {
  1: 'Very Uncomfortable',
  2: 'Uncomfortable',
  3: 'Neutral',
  4: 'Comfortable',
  5: 'Very Comfortable',
};

export const HAPTIC_PATTERN_LABELS: Record<HapticPattern, string> = {
  'standard': 'Standard',
  'gentle-wave': 'Gentle Wave',
  'soft-pulse': 'Soft Pulse',
};

export const SESSION_SITE_LABELS: Record<SessionSite, string> = {
  'arm-left': 'Left Arm',
  'arm-right': 'Right Arm',
  'thigh-left': 'Left Thigh',
  'thigh-right': 'Right Thigh',
  'abdomen-left': 'Left Abdomen',
  'abdomen-right': 'Right Abdomen',
  'other': 'Other',
};

export const SESSION_DURATION_LABELS: Record<SessionDuration, string> = {
  18: '18 sec (Quick)',
  24: '24 sec (Standard)',
  30: '30 sec (Extended)',
};
