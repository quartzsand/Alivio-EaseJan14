// src/services/TestProfileService.ts
export interface TestProfile {
  id: string;
  user_name: string;
  scientific_basis: string;
  primary_freq: number;
  duration: number;
  texture: "steady" | "pulsed_enhanced";
  validation_target: string;
  success_metric: string;
  technical_notes: string;
}

export const TEST_PROFILES: Record<string, TestProfile> = {
  test_gate_control: {
    id: "test_gate_control",
    user_name: "Test A: Sharp Pain Relief",
    scientific_basis: "Gate Control Theory - A-beta fiber saturation",
    primary_freq: 180, // iPhone optimal frequency
    duration: 18,
    texture: "steady",
    validation_target: "Fingerstick, quick needle procedures",
    success_metric: "Reduces sharp pain perception during brief procedures",
    technical_notes:
      "Continuous 180Hz sine wave optimized for iPhone speaker response. Tests gate control theory effectiveness on sharp, instantaneous pain.",
  },

  test_massage_simulation: {
    id: "test_massage_simulation",
    user_name: "Test B: Deep Comfort",
    scientific_basis: "Percussion therapy simulation with enhanced pulses",
    primary_freq: 120, // Lowest meaningful iPhone frequency
    duration: 30,
    texture: "pulsed_enhanced", // Saw^8 profile for distinct pulses
    validation_target: "Hand arthritis, muscle tension, deeper discomfort",
    success_metric: "Mimics therapeutic massage gun effect for muscle relief",
    technical_notes:
      "Enhanced sawtooth pulses (saw^8) at 120Hz with 100 BPM gating. Includes 10s entrainment ramp for sympathetic nervous system down-regulation.",
  },
};

export class TestProfileService {
  static getTestProfile(profileId: string): TestProfile | null {
    return TEST_PROFILES[profileId] || null;
  }

  static getAllTestProfiles(): TestProfile[] {
    return Object.values(TEST_PROFILES);
  }

  static isTestProfileEnabled(): Promise<boolean> {
    return AsyncStorage.getItem("alivio_advanced_settings")
      .then((settings) => {
        if (settings) {
          const parsed = JSON.parse(settings);
          return parsed.showTestProfiles === true;
        }
        return false;
      })
      .catch(() => false);
  }

  static async generateTestAudio(profileId: string): Promise<string | null> {
    const profile = this.getTestProfile(profileId);
    if (!profile) return null;

    // Generate test audio file path
    return `test-${profile.id}-${profile.duration}s.wav`;
  }
}
