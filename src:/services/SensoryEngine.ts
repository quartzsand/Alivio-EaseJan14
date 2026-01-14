import { Vibration, Platform } from "react-native";
import { Audio } from "expo-av";

// Constants
const MAX_SESSION_DURATION = 30000; // 30 seconds
const MIN_FREQUENCY = 100; // Hz
const MAX_FREQUENCY = 200; // Hz
const HAPTIC_INTENSITY = 1.0; // Maximum intensity

export class SensoryEngine {
  private lsRunning: boolean = false;
  private sessionStartTime: number = 0;
  private animationFrameId: number | null = null;
  private audioContext: Audio.Sound | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private sweepStartFreq: number = MIN_FREQUENCY;
  private sweepEndFreq: number = MAX_FREQUENCY;

  // Session duration tracking
  private sessionTimer: NodeJS.Timeout | null = null;

  // Vibration pattern: max strength continuous
  private vibrationPattern = [100, 0]; // 100ms vibrate, 0ms pause - continuous
  private audioVolume: number = 0.5; // 50% default volume

  async start(): Promise<void> {
    if (this.lsRunning) return;

    this.lsRunning = true;
    this.sessionStartTime = Date.now();

    // Apply maximum vibration strength
    if (Platform.OS !== "web") {
      await this.startVibration();
    }

    // Start sweeping wave vibration pattern
    this.startSweepingWaveVibration();

    // Start warm-toned audio
    this.playWarmTonedAudio();

    // Setup session timeout (30 seconds max)
    this.sessionTimer = setTimeout(() => {
      this.stop();
    }, MAX_SESSION_DURATION);
  }

  private async startVibration(): Promise<void> {
    try {
      // Use React Native's core Vibration API for maximum strength
      // Pattern: continuous vibration at max strength
      Vibration.vibrate(this.vibrationPattern, true);
    } catch (error) {
      console.warn("Vibration not available:", error);
    }
  }

  private startSweepingWaveVibration(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const startTime = Date.now();
    const sweepDuration = 2000; // 2 second sweep cycle

    const animate = () => {
      const elapsed = (Date.now() - startTime) % sweepDuration;
      const progress = elapsed / sweepDuration;

      // Sweep frequency from 100Hz to 200Hz and back
      const frequency =
        progress < 0.5
          ? MIN_FREQUENCY + (MAX_FREQUENCY - MIN_FREQUENCY) * (progress * 2)
          : MAX_FREQUENCY -
            (MAX_FREQUENCY - MIN_FREQUENCY) * ((progress - 0.5) * 2);

      // Update vibration intensity based on frequency sweep
      const intensity = 0.5 + Math.sin(progress * Math.PI * 2) * 0.5;

      if (this.lsRunning) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private async playWarmTonedAudio(): Promise<void> {
    try {
      // Create warm-toned audio (100-200Hz with harmonics)
      const audioContext = new (window as any).AudioContext();

      // Create fundamental tone (100-200Hz sweep)
      const osc1 = audioContext.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = MIN_FREQUENCY;

      // Create harmonics for warm tone
      const osc2 = audioContext.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = MIN_FREQUENCY * 1.5; // 150Hz / 300Hz

      const osc3 = audioContext.createOscillator();
      osc3.type = "sine";
      osc3.frequency.value = MIN_FREQUENCY * 2; // 200Hz / 400Hz

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = this.audioVolume;

      // Connect oscillators to gain
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      osc3.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Start sweep pattern
      const now = audioContext.currentTime;
      const sweepDuration = 2; // 2 seconds

      osc1.frequency.setTargetAtTime(
        MAX_FREQUENCY,
        now,
        sweepDuration / Math.LN2,
      );
      osc2.frequency.setTargetAtTime(
        MAX_FREQUENCY * 1.5,
        now,
        sweepDuration / Math.LN2,
      );
      osc3.frequency.setTargetAtTime(
        MAX_FREQUENCY * 2,
        now,
        sweepDuration / Math.LN2,
      );

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      this.oscillators = [osc1, osc2, osc3];
    } catch (error) {
      console.warn("Audio playback not available:", error);
    }
  }

  setAudioVolume(volume: number): void {
    this.audioVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0-1
  }

  stop(): void {
    if (!this.lsRunning) return;

    this.lsRunning = false;

    // Stop vibration
    if (Platform.OS !== "web") {
      Vibration.cancel();
    }

    // Stop animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop oscillators
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.oscillators = [];
    this.gains = [];

    // Close audio context if needed
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    // Clear session timer
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  lsSessionRunning(): boolean {
    return this.lsRunning;
  }

  getRemainingTime(): number {
    if (!this.lsRunning) return MAX_SESSION_DURATION;
    const elapsed = Date.now() - this.sessionStartTime;
    return Math.max(0, MAX_SESSION_DURATION - elapsed);
  }
}

export const sensoryEngine = new SensoryEngine();
