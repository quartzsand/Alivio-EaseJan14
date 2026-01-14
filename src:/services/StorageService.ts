import AsyncStorage from "@react-native-async-storage/async-storage";
import { SessionLog, UserPreferences, StreakData } from "../types";

class StorageService {
  private readonly KEYS = {
    SESSIONS: "@alivio:sessions",
    PREFERENCES: "@alivio:preferences",
    STREAK: "@alivio:streak",
    DISCLAIMER_ACCEPTED: "@alivio:disclaimer_accepted",
    PARENTAL_CONSENT: "@alivio:parental_consent",
  };

  // Session History
  async getSessionHistory(): Promise<SessionLog[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading sessions:", error);
      return [];
    }
  }

  async saveSessionLog(log: SessionLog): Promise<void> {
    try {
      const existing = await this.getSessionHistory();
      existing.push({
        ...log,
        id: Date.now().toString(),
        timestamp: new Date(),
      });
      await AsyncStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(existing));

      // Update streak
      await this.updateStreak();
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }

  // Streak Management
  async getCurrentStreak(): Promise<number> {
    try {
      const streakData = await this.getStreakData();
      return streakData.currentStreak;
    } catch (error) {
      return 0;
    }
  }

  async getStreakData(): Promise<StreakData> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.STREAK);
      return data
        ? JSON.parse(data)
        : {
            currentStreak: 0,
            longestStreak: 0,
            totalSessions: 0,
            lastSessionDate: null,
          };
    } catch (error) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        lastSessionDate: new Date(),
      };
    }
  }

  private async updateStreak(): Promise<void> {
    const streakData = await this.getStreakData();
    const now = new Date();
    const lastDate = streakData.lastSessionDate
      ? new Date(streakData.lastSessionDate)
      : null;

    if (!lastDate) {
      // First session
      streakData.currentStreak = 1;
      streakData.longestStreak = 1;
      streakData.totalSessions = 1;
    } else {
      const daysSince = Math.floor(
        (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSince === 0) {
        // Same day, don't change streak
        streakData.totalSessions += 1;
      } else if (daysSince === 1) {
        // Consecutive day
        streakData.currentStreak += 1;
        streakData.totalSessions += 1;
        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }
      } else {
        // Streak broken
        streakData.currentStreak = 1;
        streakData.totalSessions += 1;
      }
    }

    streakData.lastSessionDate = now;
    await AsyncStorage.setItem(this.KEYS.STREAK, JSON.stringify(streakData));
  }

  // Preferences
  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.PREFERENCES);
      return data
        ? JSON.parse(data)
        : {
            selectedDuration: 60,
            defaultPattern: "standard",
            defaultRoutine: "SubQ",
            vibrationIntensity: 1.0,
            audioEnabled: true,
            voiceOverEnabled: false,
            highContrastMode: false,
          };
    } catch (error) {
      return {
        selectedDuration: 60,
        defaultPattern: "standard",
        defaultRoutine: "SubQ",
        vibrationIntensity: 1.0,
        audioEnabled: true,
        voiceOverEnabled: false,
        highContrastMode: false,
      };
    }
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  }

  // Disclaimer
  async hasAcceptedDisclaimer(): Promise<boolean> {
    try {
      const accepted = await AsyncStorage.getItem(
        this.KEYS.DISCLAIMER_ACCEPTED,
      );
      return accepted === "true";
    } catch (error) {
      return false;
    }
  }

  async acceptDisclaimer(): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.DISCLAIMER_ACCEPTED, "true");
    await AsyncStorage.setItem(
      "@alivio:disclaimer_date",
      new Date().toISOString(),
    );
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  }
}

export default new StorageService();
