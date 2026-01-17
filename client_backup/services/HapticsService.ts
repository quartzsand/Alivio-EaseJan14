import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { HapticPattern, PeakStyle } from '@/types';

type SessionPhase = 'idle' | 'settle' | 'peak' | 'cool' | 'complete';

const MAX_HAPTIC_DURATION_MS = 30000;
const SNAP_MIN_HZ = 2;
const SNAP_MAX_HZ = 8;

class HapticsServiceClass {
  private isActive = false;
  private hapticLoop: ReturnType<typeof setTimeout> | null = null;
  private intensity: number = 0.5;
  private snapDensity: number = 0.5;
  private peakStyle: PeakStyle = 'max';
  private currentPhase: SessionPhase = 'idle';
  private currentPattern: HapticPattern = 'standard';
  private sessionStartTime: number = 0;
  private phaseStartTime: number = 0;
  private audioSyncCallback: (() => number) | null = null;

  setIntensity(value: number) {
    this.intensity = Math.max(0.1, Math.min(1, value));
  }

  setSnapDensity(value: number) {
    this.snapDensity = Math.max(0, Math.min(1, value));
  }

  setPeakStyle(style: PeakStyle) {
    this.peakStyle = style;
  }

  setAudioSyncCallback(callback: () => number) {
    this.audioSyncCallback = callback;
  }

  updatePhase(phase: SessionPhase) {
    if (phase !== this.currentPhase) {
      this.currentPhase = phase;
      this.phaseStartTime = Date.now();
    }
  }

  async playStartFeedback() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  }

  async playCompleteFeedback() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await this.delay(150);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  }

  async start(pattern: HapticPattern, initialPhase: SessionPhase = 'settle') {
    if (Platform.OS === 'web') return;
    
    this.stop();
    this.isActive = true;
    this.currentPattern = pattern;
    this.currentPhase = initialPhase;
    this.sessionStartTime = Date.now();
    this.phaseStartTime = Date.now();
    
    this.runHapticLoop();
  }

  private async runHapticLoop() {
    if (!this.isActive) return;
    
    const elapsed = Date.now() - this.sessionStartTime;
    if (elapsed >= MAX_HAPTIC_DURATION_MS) {
      this.stop();
      return;
    }
    
    const interval = this.calculateInterval();
    await this.executeHaptic();
    
    this.hapticLoop = setTimeout(() => this.runHapticLoop(), interval);
  }

  private calculateInterval(): number {
    const phaseElapsed = Date.now() - this.phaseStartTime;
    
    switch (this.currentPhase) {
      case 'settle':
        return this.getSettleInterval();
      case 'peak':
        return this.getPeakInterval();
      case 'cool':
        return this.getCoolInterval();
      default:
        return 1000;
    }
  }

  private getSettleInterval(): number {
    const baseInterval = 600;
    const intensityFactor = 1 - (this.intensity * 0.4);
    return Math.round(baseInterval * intensityFactor);
  }

  private getPeakInterval(): number {
    if (this.peakStyle === 'max') {
      const baseHz = 10;
      return Math.round(1000 / baseHz);
    } else {
      const targetHz = SNAP_MIN_HZ + (this.snapDensity * (SNAP_MAX_HZ - SNAP_MIN_HZ));
      return Math.round(1000 / targetHz);
    }
  }

  private getCoolInterval(): number {
    const phaseElapsed = Date.now() - this.phaseStartTime;
    const baseInterval = 400;
    const slowdown = Math.min(phaseElapsed / 3000, 1) * 400;
    return Math.round(baseInterval + slowdown);
  }

  private async executeHaptic() {
    if (!this.isActive || Platform.OS === 'web') return;
    
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
      }
    } catch (e) {}
  }

  private async executeSettleHaptic() {
    const style = this.intensity > 0.6 
      ? Haptics.ImpactFeedbackStyle.Medium 
      : Haptics.ImpactFeedbackStyle.Light;
    
    await Haptics.impactAsync(style);
    
    if (this.currentPattern === 'gentle-wave') {
      await this.delay(60);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  private async executePeakHaptic() {
    if (this.peakStyle === 'max') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (this.intensity > 0.7) {
        await this.delay(30);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (this.snapDensity > 0.5) {
        await this.delay(40);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }

  private async executeCoolHaptic() {
    const phaseElapsed = Date.now() - this.phaseStartTime;
    const fade = Math.max(0, 1 - phaseElapsed / 6000);
    
    if (fade > 0.5) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (fade > 0.2) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isActive = false;
    if (this.hapticLoop) {
      clearTimeout(this.hapticLoop);
      this.hapticLoop = null;
    }
    this.currentPhase = 'idle';
  }

  cleanup() {
    this.stop();
    this.audioSyncCallback = null;
  }

  getDebugInfo() {
    return {
      isActive: this.isActive,
      currentPhase: this.currentPhase,
      currentPattern: this.currentPattern,
      intensity: this.intensity,
      snapDensity: this.snapDensity,
      peakStyle: this.peakStyle,
      elapsedMs: Date.now() - this.sessionStartTime,
      phaseElapsedMs: Date.now() - this.phaseStartTime,
    };
  }
}

export const HapticsService = new HapticsServiceClass();
