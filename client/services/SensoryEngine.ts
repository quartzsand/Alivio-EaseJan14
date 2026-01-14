import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { HapticPattern } from '@/types';

class SensoryEngineService {
  private isVibrating = false;
  private vibrationInterval: ReturnType<typeof setTimeout> | null = null;
  private intensity: number = 0.5;

  setIntensity(value: number) {
    this.intensity = Math.max(0, Math.min(1, value));
  }

  async playStartSound() {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.log('Start sound feedback not available');
      }
    }
  }

  async playCompleteSound() {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise(resolve => setTimeout(resolve, 200));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.log('Complete sound feedback not available');
      }
    }
  }

  async triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') {
    if (Platform.OS === 'web') return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.log('Haptics not available');
    }
  }

  async startPattern(pattern: HapticPattern) {
    if (Platform.OS === 'web') return;
    
    this.stopPattern();
    this.isVibrating = true;

    const runPattern = async () => {
      if (!this.isVibrating) return;

      switch (pattern) {
        case 'standard':
          await this.runStandardPattern();
          break;
        case 'gentle-wave':
          await this.runGentleWavePattern();
          break;
        case 'soft-pulse':
          await this.runSoftPulsePattern();
          break;
      }
    };

    runPattern();
  }

  private async runStandardPattern() {
    if (!this.isVibrating) return;
    
    const baseDelay = 800 - (this.intensity * 400);
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    this.vibrationInterval = setTimeout(async () => {
      if (this.isVibrating) {
        await this.runStandardPattern();
      }
    }, baseDelay);
  }

  private async runGentleWavePattern() {
    if (!this.isVibrating) return;
    
    const sequence = [
      { style: Haptics.ImpactFeedbackStyle.Light, delay: 150 },
      { style: Haptics.ImpactFeedbackStyle.Light, delay: 150 },
      { style: Haptics.ImpactFeedbackStyle.Medium, delay: 200 },
      { style: Haptics.ImpactFeedbackStyle.Light, delay: 150 },
      { style: Haptics.ImpactFeedbackStyle.Light, delay: 600 },
    ];

    for (const step of sequence) {
      if (!this.isVibrating) break;
      await Haptics.impactAsync(step.style);
      await this.delay(step.delay * (1.5 - this.intensity * 0.5));
    }

    if (this.isVibrating) {
      this.vibrationInterval = setTimeout(() => this.runGentleWavePattern(), 100);
    }
  }

  private async runSoftPulsePattern() {
    if (!this.isVibrating) return;
    
    const pulseDelay = 1200 - (this.intensity * 600);
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    this.vibrationInterval = setTimeout(async () => {
      if (this.isVibrating) {
        await this.runSoftPulsePattern();
      }
    }, pulseDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopPattern() {
    this.isVibrating = false;
    if (this.vibrationInterval) {
      clearTimeout(this.vibrationInterval);
      this.vibrationInterval = null;
    }
  }

  async cleanup() {
    this.stopPattern();
  }
}

export const SensoryEngine = new SensoryEngineService();
