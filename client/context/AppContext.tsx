import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { StorageService } from '@/services/StorageService';
import type { SessionLog, UserPreferences, OnboardingState } from '@/types';

interface AppContextType {
  isLoading: boolean;
  onboarding: OnboardingState;
  preferences: UserPreferences;
  sessions: SessionLog[];
  sessionsThisWeek: number;
  updateOnboarding: (updates: Partial<OnboardingState>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  addSession: (session: SessionLog) => Promise<void>;
  clearSessions: () => Promise<void>;
  resetApp: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: '',
  hapticIntensity: 0.5,
  audioEnabled: true,
  avatarId: 'blue',
  theme: 'light',
};

const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  disclaimerAccepted: false,
  age: null,
  parentalConsentGiven: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<OnboardingState>(DEFAULT_ONBOARDING);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);

  const refreshData = useCallback(async () => {
    try {
      const [onboardingData, preferencesData, sessionsData, weekCount] = await Promise.all([
        StorageService.getOnboarding(),
        StorageService.getPreferences(),
        StorageService.getSessions(),
        StorageService.getSessionsThisWeek(),
      ]);
      setOnboarding(onboardingData);
      setPreferences(preferencesData);
      setSessions(sessionsData);
      setSessionsThisWeek(weekCount);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await refreshData();
      setIsLoading(false);
    };
    loadData();
  }, [refreshData]);

  const updateOnboarding = useCallback(async (updates: Partial<OnboardingState>) => {
    const updated = { ...onboarding, ...updates };
    setOnboarding(updated);
    await StorageService.saveOnboarding(updates);
  }, [onboarding]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    await StorageService.savePreferences(updates);
  }, [preferences]);

  const addSession = useCallback(async (session: SessionLog) => {
    setSessions(prev => [session, ...prev]);
    await StorageService.addSession(session);
    const weekCount = await StorageService.getSessionsThisWeek();
    setSessionsThisWeek(weekCount);
  }, []);

  const clearSessions = useCallback(async () => {
    setSessions([]);
    setSessionsThisWeek(0);
    await StorageService.clearSessions();
  }, []);

  const resetApp = useCallback(async () => {
    await StorageService.resetApp();
    setOnboarding(DEFAULT_ONBOARDING);
    setPreferences(DEFAULT_PREFERENCES);
    setSessions([]);
    setSessionsThisWeek(0);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        onboarding,
        preferences,
        sessions,
        sessionsThisWeek,
        updateOnboarding,
        updatePreferences,
        addSession,
        clearSessions,
        resetApp,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
