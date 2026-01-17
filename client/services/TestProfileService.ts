// client/services/TestProfileService.ts
// Test Profile Service for scientific validation and user preference discovery
// Two test profiles: Gate Control Theory and Massage Simulation

import AsyncStorage from "@react-native-async-storage/async-storage";
import { sensoryService } from "./SensoryService";
import type { TestProfile } from "./audio/ExpoAVAudioEngine";
import type { HapticPattern, PeakStyle } from "@/types";

const STORAGE_KEY = "alivio_test_profile_results";

export interface TestResult {
  profileId: TestProfile;
  timestamp: string;
  rating: 1 | 2 | 3 | 4 | 5;
  sensationDescription?: string;
  preferredFor?: string[];
}

export interface TestProfileInfo {
  id: TestProfile;
  displayName: string;
  description: string;
  scientificBasis: string;
  duration: number;
  recommendedFor: string[];
  frequencies: {
    primary: number;
    chassis: number;
  };
}

// Test profile configurations with iPhone optimization
export const TEST_PROFILES: Record<TestProfile, TestProfileInfo> = {
  test_gate_control: {
    id: "test_gate_control",
    displayName: "Test A: Sharp Pain Relief",
    description: "Pure continuous sensation optimized for sharp, instant discomfort",
    scientificBasis: "Gate Control Theory - saturates A-beta nerve fibers to reduce pain signal transmission",
    duration: 18,
    recommendedFor: ["Finger pricks", "Sharp needles", "Sensitive areas"],
    frequencies: {
      primary: 180, // iPhone speaker sweet spot
      chassis: 170, // iPhone LRA resonance
    },
  },
  test_massage_simulation: {
    id: "test_massage_simulation",
    displayName: "Test B: Deep Comfort",
    description: "Rhythmic pulsing that mimics massage gun sensation",
    scientificBasis: "Entrainment + distraction - rhythmic stimulation promotes relaxation response",
    duration: 30,
    recommendedFor: ["IM injections", "Muscle aches", "Anxiety reduction"],
    frequencies: {
      primary: 120, // Lowest meaningful iPhone frequency
      chassis: 150, // Optimized for chassis coupling
    },
  },
};

export class TestProfileService {
  private static instance: TestProfileService;
  
  static getInstance(): TestProfileService {
    if (!TestProfileService.instance) {
      TestProfileService.instance = new TestProfileService();
    }
    return TestProfileService.instance;
  }

  /**
   * Run a test profile session
   */
  async runTest(
    profileId: TestProfile,
    options: {
      audioEnabled: boolean;
      hapticsIntensity: number;
      audioVolume: number;
    }
  ): Promise<void> {
    const profile = TEST_PROFILES[profileId];
    
    if (!profile) {
      throw new Error(`Unknown test profile: ${profileId}`);
    }

    // Start the test profile via sensory service
    await sensoryService.startTestProfile(profileId, {
      pattern: "standard" as HapticPattern,
      phase: "settle",
      audioEnabled: options.audioEnabled,
      hapticsIntensity01: options.hapticsIntensity,
      audioVolume01: options.audioVolume,
      peakStyle: "max" as PeakStyle,
      snapDensity01: 0.5,
      useAdvancedHaptics: true,
    });
  }

  /**
   * Stop current test
   */
  async stopTest(): Promise<void> {
    await sensoryService.stop();
  }

  /**
   * Save test results
   */
  async saveResult(result: TestResult): Promise<void> {
    try {
      const existing = await this.getResults();
      const updated = [result, ...existing.slice(0, 49)]; // Keep last 50
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving test result:", error);
    }
  }

  /**
   * Get all test results
   */
  async getResults(): Promise<TestResult[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting test results:", error);
      return [];
    }
  }

  /**
   * Get results for a specific profile
   */
  async getResultsForProfile(profileId: TestProfile): Promise<TestResult[]> {
    const all = await this.getResults();
    return all.filter((r) => r.profileId === profileId);
  }

  /**
   * Get the user's preferred test profile based on ratings
   */
  async getPreferredProfile(): Promise<TestProfile | null> {
    const results = await this.getResults();
    
    if (results.length === 0) return null;

    // Calculate average rating per profile
    const ratings: Record<TestProfile, { sum: number; count: number }> = {
      test_gate_control: { sum: 0, count: 0 },
      test_massage_simulation: { sum: 0, count: 0 },
    };

    for (const result of results) {
      ratings[result.profileId].sum += result.rating;
      ratings[result.profileId].count += 1;
    }

    // Find profile with highest average rating
    let best: TestProfile | null = null;
    let bestAvg = 0;

    for (const [profileId, data] of Object.entries(ratings)) {
      if (data.count > 0) {
        const avg = data.sum / data.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          best = profileId as TestProfile;
        }
      }
    }

    return best;
  }

  /**
   * Get recommendation based on use case
   */
  getRecommendationFor(useCase: string): TestProfile {
    const useCaseLower = useCase.toLowerCase();
    
    if (
      useCaseLower.includes("sharp") ||
      useCaseLower.includes("needle") ||
      useCaseLower.includes("finger") ||
      useCaseLower.includes("subq")
    ) {
      return "test_gate_control";
    }
    
    if (
      useCaseLower.includes("muscle") ||
      useCaseLower.includes("im") ||
      useCaseLower.includes("deep") ||
      useCaseLower.includes("anxiety")
    ) {
      return "test_massage_simulation";
    }
    
    // Default to gate control for general use
    return "test_gate_control";
  }

  /**
   * Clear all test results
   */
  async clearResults(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get all available test profiles
   */
  static getAvailableProfiles(): TestProfileInfo[] {
    return Object.values(TEST_PROFILES);
  }

  /**
   * Get profile info by ID
   */
  static getProfileInfo(profileId: TestProfile): TestProfileInfo | undefined {
    return TEST_PROFILES[profileId];
  }
}

// Export singleton
export const testProfileService = TestProfileService.getInstance();
