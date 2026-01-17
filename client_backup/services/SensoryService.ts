// client/services/SensoryService.ts - COMPLETE FILE WITH FIXED AUDIO
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

export interface UserPreferences {
  vibrationIntensity: number;
  audioEnabled: boolean;
  visualEffectsEnabled: boolean;
  defaultDuration: number;
  preferredSite: string;
}

export interface SensorySession {
  id: string;
  startTime: string;
  duration: number;
  site: string;
  intensity: number;
  completedSuccessfully: boolean;
  painRatingBefore?: number;
  painRatingAfter?: number;
  notes?: string;
}

const STORAGE_KEYS = {
  USER_PREFERENCES: "alivio_user_preferences",
  SESSION_HISTORY: "alivio_session_history",
};

const DEFAULT_PREFERENCES: UserPreferences = {
  vibrationIntensity: 0.7,
  audioEnabled: true,
  visualEffectsEnabled: true,
  defaultDuration: 24,
  preferredSite: "thigh",
};

export class SensoryService {
  private currentPhase: string = "idle";
  private hapticEngine: any = null;
  private audioEngine: any = null;
  private isRunning: boolean = false;
  private sessionTimer: NodeJS.Timeout | null = null;
  private phaseTimers: NodeJS.Timeout[] = [];

  constructor() {
    this.initialize();
  }

  // FIXED AUDIO INITIALIZATION
  private async initialize(): Promise<void> {
    try {
      // Use simplified, valid audio configuration
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false, // Keep simple for now
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        // Removed problematic interruption modes
      });

      console.log("SensoryService initialized successfully with audio");
    } catch (error) {
      console.warn("Audio setup failed, continuing without audio:", error);
      // Continue initialization even if audio fails
    }
  }

  // Update phase method - REQUIRED
  updatePhase(phase: string, isRunning: boolean = true): void {
    console.log(
      `Updating phase from ${this.currentPhase} to: ${phase}, running: ${isRunning}`,
    );

    const previousPhase = this.currentPhase;
    this.currentPhase = phase;
    this.isRunning = isRunning;

    // Handle phase transitions
    switch (phase) {
      case "idle":
        this.handleIdlePhase();
        break;
      case "prep":
        this.handlePrepPhase();
        break;
      case "active":
        this.handleActivePhase();
        break;
      case "cool":
        this.handleCoolPhase();
        break;
      case "complete":
        this.handleCompletePhase();
        break;
      default:
        console.warn(`Unknown phase: ${phase}`);
    }

    // Emit phase change event if needed
    this.onPhaseChange?.(previousPhase, phase, isRunning);
  }

  private handleIdlePhase(): void {
    this.stop();
  }

  private handlePrepPhase(): void {
    console.log("Starting preparation phase");
    this.startGentleHaptics();
  }

  private handleActivePhase(): void {
    console.log("Starting active phase");
    this.startIntenseHaptics();
  }

  private handleCoolPhase(): void {
    console.log("Starting cooldown phase");
    this.startCooldownHaptics();
  }

  private handleCompletePhase(): void {
    console.log("Session complete");
    this.stop();
  }

  // Stop method - REQUIRED
  stop(): void {
    console.log("Stopping sensory service");

    try {
      // Clear all timers
      this.phaseTimers.forEach((timer) => clearTimeout(timer));
      this.phaseTimers = [];

      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      // Stop haptics
      if (this.hapticEngine) {
        this.hapticEngine.stop?.();
        this.hapticEngine = null;
      }

      // Stop audio
      if (this.audioEngine) {
        this.audioEngine.stopAsync?.();
        this.audioEngine.unloadAsync?.();
        this.audioEngine = null;
      }

      this.isRunning = false;
      this.currentPhase = "idle";
    } catch (error) {
      console.error("Error stopping sensory service:", error);
    }
  }

  // Start session with proper phase timing
  async startSession(duration: number, site: string): Promise<void> {
    try {
      this.stop(); // Ensure clean state

      console.log(`Starting sensory session: ${duration}s at ${site}`);

      // Update to prep phase
      this.updatePhase("prep", true);

      // Schedule phase transitions based on duration
      this.schedulePhaseTransitions(duration);
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  }

  private schedulePhaseTransitions(duration: number): void {
    // Phase timing configurations
    const phaseConfigs = {
      18: { prep: 3, active: 12, cool: 3 },
      24: { prep: 4, active: 16, cool: 4 },
      30: { prep: 5, active: 20, cool: 5 },
    };

    const config = phaseConfigs[duration] || phaseConfigs[24];

    // Prep -> Active
    const activeTimer = setTimeout(() => {
      if (this.isRunning) {
        this.updatePhase("active", true);
      }
    }, config.prep * 1000);
    this.phaseTimers.push(activeTimer);

    // Active -> Cool
    const coolTimer = setTimeout(
      () => {
        if (this.isRunning) {
          this.updatePhase("cool", true);
        }
      },
      (config.prep + config.active) * 1000,
    );
    this.phaseTimers.push(coolTimer);

    // Cool -> Complete
    const completeTimer = setTimeout(() => {
      this.updatePhase("complete", false);
    }, duration * 1000);
    this.phaseTimers.push(completeTimer);
  }

  private startGentleHaptics(): void {
    if (!this.isRunning) return;

    const hapticPattern = () => {
      if (!this.isRunning || this.currentPhase !== "prep") return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const timer = setTimeout(hapticPattern, 2000); // Every 2 seconds
      this.phaseTimers.push(timer);
    };

    hapticPattern();
  }

  private startIntenseHaptics(): void {
    if (!this.isRunning) return;

    const hapticPattern = () => {
      if (!this.isRunning || this.currentPhase !== "active") return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const timer = setTimeout(hapticPattern, 800); // Every 0.8 seconds
      this.phaseTimers.push(timer);
    };

    hapticPattern();
  }

  private startCooldownHaptics(): void {
    if (!this.isRunning) return;

    const hapticPattern = () => {
      if (!this.isRunning || this.currentPhase !== "cool") return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const timer = setTimeout(hapticPattern, 1500); // Every 1.5 seconds
      this.phaseTimers.push(timer);
    };

    hapticPattern();
  }

  // Play audio feedback (optional)
  async playAudioFeedback(type: "start" | "phase" | "complete"): Promise<void> {
    try {
      const preferences = await this.getPreferences();
      if (!preferences.audioEnabled) return;

      // Simple audio feedback using system sounds
      switch (type) {
        case "start":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          break;
        case "phase":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          );
          break;
        case "complete":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          break;
      }
    } catch (error) {
      console.warn("Audio feedback failed:", error);
    }
  }

  // Preferences management
  async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
      throw error;
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const stored = raw ? JSON.parse(raw) : null;
      return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  // Session history
  async saveSession(session: SensorySession): Promise<void> {
    try {
      const history = await this.getSessionHistory();
      const updated = [session, ...history.slice(0, 49)]; // Keep last 50
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION_HISTORY,
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error("Error saving session:", error);
      throw error;
    }
  }

  async getSessionHistory(): Promise<SensorySession[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Get session statistics
  async getSessionStats(): Promise<{
    totalSessions: number;
    averageDuration: number;
    favoritesite: string;
    completionRate: number;
  }> {
    try {
      const history = await this.getSessionHistory();

      if (history.length === 0) {
        return {
          totalSessions: 0,
          averageDuration: 0,
          favoritesite: "thigh",
          completionRate: 0,
        };
      }

      const totalSessions = history.length;
      const completedSessions = history.filter((s) => s.completedSuccessfully);
      const averageDuration =
        history.reduce((sum, s) => sum + s.duration, 0) / totalSessions;

      // Find most common site
      const siteCounts = history.reduce(
        (acc, session) => {
          acc[session.site] = (acc[session.site] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const favoritesite =
        Object.entries(siteCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "thigh";

      return {
        totalSessions,
        averageDuration: Math.round(averageDuration),
        favoritesite,
        completionRate: Math.round(
          (completedSessions.length / totalSessions) * 100,
        ),
      };
    } catch (error) {
      console.error("Error getting session stats:", error);
      return {
        totalSessions: 0,
        averageDuration: 0,
        favoritesite: "thigh",
        completionRate: 0,
      };
    }
  }

  // Getters
  getCurrentPhase(): string {
    return this.currentPhase;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  // Optional callback for phase changes
  public onPhaseChange?: (
    previousPhase: string,
    newPhase: string,
    isRunning: boolean,
  ) => void;
}

export default SensoryService;
