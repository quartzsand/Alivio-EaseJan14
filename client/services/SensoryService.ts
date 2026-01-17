// client/services/SensoryService.ts
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
  defaultDuration: 60,
  preferredSite: "thigh",
};

export class SensoryService {
  private currentPhase: string = "idle";
  private hapticEngine: any = null;
  private audioEngine: any = null;
  private isRunning: boolean = false;
  private sessionTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Error initializing SensoryService:", error);
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
      // Stop haptics
      if (this.hapticEngine) {
        this.hapticEngine.stop?.();
        this.hapticEngine = null;
      }

      // Stop audio
      if (this.audioEngine) {
        this.audioEngine.stop?.();
        this.audioEngine = null;
      }

      // Clear timer
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      this.isRunning = false;
      this.currentPhase = "idle";
    } catch (error) {
      console.error("Error stopping sensory service:", error);
    }
  }

  // Start session
  async startSession(duration: number, site: string): Promise<void> {
    try {
      this.stop(); // Ensure clean state

      console.log(`Starting sensory session: ${duration}s at ${site}`);

      // Update to prep phase
      this.updatePhase("prep", true);

      // Schedule phase transitions
      this.schedulePhaseTransitions(duration);
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  }

  private schedulePhaseTransitions(duration: number): void {
    const prepDuration = Math.min(10, duration * 0.2); // 20% or 10s max
    const activeDuration = duration * 0.6; // 60%
    const coolDuration = duration * 0.2; // 20%

    // Prep -> Active
    setTimeout(() => {
      if (this.isRunning) {
        this.updatePhase("active", true);
      }
    }, prepDuration * 1000);

    // Active -> Cool
    setTimeout(
      () => {
        if (this.isRunning) {
          this.updatePhase("cool", true);
        }
      },
      (prepDuration + activeDuration) * 1000,
    );

    // Cool -> Complete
    setTimeout(() => {
      this.updatePhase("complete", false);
    }, duration * 1000);
  }

  private startGentleHaptics(): void {
    if (!this.isRunning) return;

    const hapticPattern = () => {
      if (!this.isRunning || this.currentPhase !== "prep") return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(hapticPattern, 2000); // Every 2 seconds
    };

    hapticPattern();
  }

  private startIntenseHaptics(): void {
    if (!this.isRunning) return;

    const hapticPattern = () => {
      if (!this.isRunning || this.currentPhase !== "active") return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(hapticPattern, 800); // Every 0.8 seconds
    };

    hapticPattern();
  }

  private startCooldownHaptics(): void {
    if (!this.isRunning) return;

    const hapticPattern = () => {
      if (!this.isRunning || this.currentPhase !== "cool") return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(hapticPattern, 1500); // Every 1.5 seconds
    };

    hapticPattern();
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
