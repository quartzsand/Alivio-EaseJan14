export type HapticPattern = 'standard' | 'gentle-wave' | 'soft-pulse';

export type ComfortRating = 1 | 2 | 3 | 4 | 5;

export interface SessionLog {
  id: string;
  date: string;
  duration: number;
  hapticPattern: HapticPattern;
  comfortRating: ComfortRating;
  notes?: string;
}

export interface UserPreferences {
  displayName: string;
  hapticIntensity: number;
  audioEnabled: boolean;
  avatarId: string;
  dragonflyVariant: 'blue' | 'white';
  theme: 'light' | 'dark' | 'auto';
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
