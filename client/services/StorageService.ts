import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionLog, UserPreferences, OnboardingState, AppState } from '@/types';

const STORAGE_KEYS = {
  SESSIONS: '@alivio_sessions',
  PREFERENCES: '@alivio_preferences',
  ONBOARDING: '@alivio_onboarding',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: '',
  hapticIntensity: 0.5,
  audioEnabled: true,
  avatarId: 'blue',
  dragonflyVariant: 'blue',
  theme: 'light',
};

const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  disclaimerAccepted: false,
  age: null,
  parentalConsentGiven: false,
};

class StorageServiceClass {
  async getSessions(): Promise<SessionLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  async saveSessions(sessions: SessionLog[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  async addSession(session: SessionLog): Promise<void> {
    const sessions = await this.getSessions();
    sessions.unshift(session);
    await this.saveSessions(sessions);
  }

  async clearSessions(): Promise<void> {
    await this.saveSessions([]);
  }

  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  async getOnboarding(): Promise<OnboardingState> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return data ? { ...DEFAULT_ONBOARDING, ...JSON.parse(data) } : DEFAULT_ONBOARDING;
    } catch (error) {
      console.error('Error loading onboarding:', error);
      return DEFAULT_ONBOARDING;
    }
  }

  async saveOnboarding(onboarding: Partial<OnboardingState>): Promise<void> {
    try {
      const current = await this.getOnboarding();
      const updated = { ...current, ...onboarding };
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving onboarding:', error);
    }
  }

  async completeOnboarding(): Promise<void> {
    await this.saveOnboarding({ completed: true });
  }

  async getAppState(): Promise<AppState> {
    const [onboarding, preferences, sessions] = await Promise.all([
      this.getOnboarding(),
      this.getPreferences(),
      this.getSessions(),
    ]);
    return { onboarding, preferences, sessions };
  }

  async resetApp(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.PREFERENCES,
        STORAGE_KEYS.ONBOARDING,
      ]);
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  }

  async getSessionsThisWeek(): Promise<number> {
    const sessions = await this.getSessions();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneWeekAgo;
    }).length;
  }
}

export const StorageService = new StorageServiceClass();
