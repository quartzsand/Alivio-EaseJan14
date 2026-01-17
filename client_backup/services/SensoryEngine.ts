import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { HapticPattern, PeakStyle } from '@/types';

type SessionPhase = 'idle' | 'settle' | 'peak' | 'cool' | 'complete';

class SensoryEngineService {
  private isVibrating = false;
  private vibrationInterval: ReturnType<typeof setTimeout> | null = null;
  private intensity: number = 0.5;
  private snapDensity: number = 0.5;
  private peakStyle: PeakStyle = 'max';
  private currentPhase: SessionPhase = 'idle';
  private currentPattern: HapticPattern = 'standard';
  private syncClock: number = 0;
  private lastHapticTime: number = 0;

  setIntensity(value: number) {
    this.intensity = Math.max(0, Math.min(1, value));
  }

  setSnapDensity(value: number) {
    this.snapDensity = Math.max(0.1, Math.min(1, value));
  }

  setPeakStyle(style: PeakStyle) {
    this.peakStyle = style;
  }

  updatePhase(phase: SessionPhase) {
    this.currentPhase = phase;
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

  async startPattern(pattern: HapticPattern, phase?: SessionPhase) {
    if (Platform.OS === 'web') return;
    
    this.stopPattern();
    this.isVibrating = true;
    this.currentPattern = pattern;
    this.currentPhase = phase || 'settle';
    this.syncClock = Date.now();

    this.runSynchronizedPattern();
  }

  private async runSynchronizedPattern() {
    if (!this.isVibrating) return;

    const now = Date.now();
    const elapsed = now - this.syncClock;
    
    const phaseMultiplier = this.getPhaseMultiplier();
    const densityMultiplier = 0.5 + this.snapDensity * 0.5;
    
    const baseInterval = this.getBaseInterval();
    const adjustedInterval = baseInterval / (phaseMultiplier * densityMultiplier);

    if (now - this.lastHapticTime >= adjustedInterval) {
      await this.executeHapticForPhase();
      this.lastHapticTime = now;
    }

    this.vibrationInterval = setTimeout(() => this.runSynchronizedPattern(), 16);
  }

  private getPhaseMultiplier(): number {
    switch (this.currentPhase) {
      case 'settle':
        return 0.7;
      case 'peak':
        return this.peakStyle === 'max' ? 1.5 : 1.2;
      case 'cool':
        return 0.5;
      default:
        return 0.6;
    }
  }

  private getBaseInterval(): number {
    switch (this.currentPattern) {
      case 'standard':
        return 800 - (this.intensity * 400);
      case 'gentle-wave':
        return 1000 - (this.intensity * 300);
      case 'soft-pulse':
        return 1200 - (this.intensity * 400);
      default:
        return 800;
    }
  }

  private async executeHapticForPhase() {
    if (!this.isVibrating || Platform.OS === 'web') return;

    try {
      switch (this.currentPhase) {
        case 'settle':
          await this.executeSettleHaptic();
          break;
        case 'peak':
          await this.executePeakHaptic();
          break;
        case 'cool':
          await this.executeCoolHaptic();
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Haptic execution failed');
    }
  }

  private async executeSettleHaptic() {
    const style = this.intensity > 0.7 
      ? Haptics.ImpactFeedbackStyle.Medium 
      : Haptics.ImpactFeedbackStyle.Light;
    
    await Haptics.impactAsync(style);
    
    if (this.currentPattern === 'gentle-wave') {
      await this.delay(80);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  private async executePeakHaptic() {
    if (this.peakStyle === 'max') {
      const style = this.intensity > 0.5 
        ? Haptics.ImpactFeedbackStyle.Heavy 
        : Haptics.ImpactFeedbackStyle.Medium;
      
      await Haptics.impactAsync(style);
      
      if (this.snapDensity > 0.6) {
        await this.delay(50);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await this.delay(40);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (this.snapDensity > 0.7) {
        await this.delay(60);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }

  private async executeCoolHaptic() {
    const style = Haptics.ImpactFeedbackStyle.Light;
    await Haptics.impactAsync(style);
    
    if (this.currentPattern === 'soft-pulse') {
      await this.delay(100);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
    this.currentPhase = 'idle';
  }

  async cleanup() {
    this.stopPattern();
  }

  getSyncInfo() {
    return {
      isVibrating: this.isVibrating,
      currentPhase: this.currentPhase,
      currentPattern: this.currentPattern,
      intensity: this.intensity,
      snapDensity: this.snapDensity,
      peakStyle: this.peakStyle,
      elapsedMs: Date.now() - this.syncClock,
    };
  }
}

export const SensoryEngine = new SensoryEngineService();
