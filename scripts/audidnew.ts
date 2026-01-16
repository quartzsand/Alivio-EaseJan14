// src/services/SensoryAudioService.ts (Updated)
export class SensoryAudioService {

  static getAudioFile(profile: string, texture: string, duration: number) {
    const key = `${profile}-${texture}-${duration}s`;

    try {
      // Load from generated files
      const audioFile = require(`../assets/audio/sensory-tracks/${key}.wav`);
      return audioFile;
    } catch (error) {
      console.error(`Audio file not found: ${key}`, error);
      return null;
    }
  }

  static getTestAudioFile(testId: string, duration: number) {
    const key = `${testId}-${duration}s`;

    try {
      const audioFile = require(`../assets/audio/test-profiles/${key}.wav`);
      return audioFile;
    } catch (error) {
      console.error(`Test audio file not found: ${key}`, error);
      return null;
    }
  }

  // ... rest of service methods
}