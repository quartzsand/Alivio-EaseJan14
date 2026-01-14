export interface SessionLog {
  id: string;
  timestamp: Date;
  duration: number;
  pattern: "standard" | "gentle-wave" | "soft-pulse";
  routineType: "SubQ" | "IM" | "Fingerstick" | "Other";
  comfortRating: number; // 1-10
  calmness?: number;
  confidence?: number;
  notes?: string;
}

export interface UserPreferences {
  selectedDuration: 30 | 60 | 120;
  defaultPattern: string;
  defaultRoutine: string;
  vibrationIntensity: number; // 0.5-1.0
  audioEnabled: boolean;
  voiceOverEnabled: boolean;
  highContrastMode: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  lastSessionDate: Date;
}

export interface SensoryPattern {
  name: string;
  description: string;
  intervalMs: number;
  style: "standard" | "gentle" | "rhythmic" | "varied";
}
