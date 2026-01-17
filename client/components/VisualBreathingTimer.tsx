// client/components/VisualBreathingTimer.tsx
// Visual Breathing Timer with synchronized animations
// Technical Specs:
// - Timer Animation: ±8-12% size pulsing, 2-3° wobble
// - Background Gradient: Radial pulse synced to audio amplitude (mocked in Expo Go)
// - Performance: Smooth 60fps animations
// - Accessibility: Reduces to static timer if motion sensitivity enabled

import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Animated, Dimensions, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Typography } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Phase = "idle" | "settle" | "peak" | "cool" | "complete";

interface VisualBreathingTimerProps {
  timeRemaining: number;
  totalDuration: number;
  phase: Phase;
  intensity: number; // 0-1
  isRunning: boolean;
  musicPositionMs?: number;
  reduceMotion?: boolean; // Accessibility option
}

// Phase-specific animation configurations
const PHASE_CONFIGS = {
  idle: {
    pulseMin: 1.0,
    pulseMax: 1.02,
    pulseDuration: 2000,
    wobbleAngle: 0,
    gradientColors: ["#F8F9FA", "#E8EAED"],
  },
  settle: {
    pulseMin: 0.96,
    pulseMax: 1.04,
    pulseDuration: 3000, // Slow breathing
    wobbleAngle: 1.5,
    gradientColors: ["#E3F2FD", "#BBDEFB", "#E3F2FD"],
  },
  peak: {
    pulseMin: 0.88,
    pulseMax: 1.12,
    pulseDuration: 800, // Fast, urgent
    wobbleAngle: 3,
    gradientColors: ["#FFEBEE", "#FFCDD2", "#FFEBEE"],
  },
  cool: {
    pulseMin: 0.94,
    pulseMax: 1.06,
    pulseDuration: 2000, // Slowing down
    wobbleAngle: 1,
    gradientColors: ["#E8F5E9", "#C8E6C9", "#E8F5E9"],
  },
  complete: {
    pulseMin: 1.0,
    pulseMax: 1.08,
    pulseDuration: 1500,
    wobbleAngle: 0,
    gradientColors: ["#E8F5E9", "#A5D6A7", "#E8F5E9"],
  },
};

export function VisualBreathingTimer({
  timeRemaining,
  totalDuration,
  phase,
  intensity,
  isRunning,
  musicPositionMs = 0,
  reduceMotion = false,
}: VisualBreathingTimerProps) {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  const config = PHASE_CONFIGS[phase];

  // Calculate intensity-adjusted pulse range
  const adjustedPulseMin = useMemo(() => {
    const base = config.pulseMin;
    const intensityAdjust = (1 - config.pulseMin) * intensity * 0.5;
    return base - intensityAdjust;
  }, [config.pulseMin, intensity]);

  const adjustedPulseMax = useMemo(() => {
    const base = config.pulseMax;
    const intensityAdjust = (config.pulseMax - 1) * intensity * 0.5;
    return base + intensityAdjust;
  }, [config.pulseMax, intensity]);

  // Pulse animation (breathing effect)
  useEffect(() => {
    if (reduceMotion || !isRunning) {
      pulseAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: adjustedPulseMax,
          duration: config.pulseDuration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: adjustedPulseMin,
          duration: config.pulseDuration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [
    isRunning,
    reduceMotion,
    config.pulseDuration,
    adjustedPulseMin,
    adjustedPulseMax,
    pulseAnim,
  ]);

  // Wobble animation (subtle rotation)
  useEffect(() => {
    if (reduceMotion || !isRunning || config.wobbleAngle === 0) {
      wobbleAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(wobbleAnim, {
          toValue: config.wobbleAngle,
          duration: config.pulseDuration / 4,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: -config.wobbleAngle,
          duration: config.pulseDuration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: 0,
          duration: config.pulseDuration / 4,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isRunning, reduceMotion, config.wobbleAngle, config.pulseDuration, wobbleAnim]);

  // Concentric ring animation (radiating pulse)
  useEffect(() => {
    if (reduceMotion || !isRunning) {
      ringAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: config.pulseDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [isRunning, reduceMotion, config.pulseDuration, ringAnim]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress percentage
  const progress = totalDuration > 0 ? 1 - timeRemaining / totalDuration : 0;

  // Ring scale animation interpolation
  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.4],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  // Wobble rotation interpolation
  const wobbleRotate = wobbleAnim.interpolate({
    inputRange: [-5, 5],
    outputRange: ["-5deg", "5deg"],
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={config.gradientColors as any}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Concentric Rings (radiating pulse effect) */}
      {isRunning && !reduceMotion && (
        <>
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
                borderColor: getPhaseColor(phase),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ringInner,
              {
                transform: [
                  {
                    scale: ringAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1.2],
                    }),
                  },
                ],
                opacity: ringAnim.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0.4, 0.15, 0],
                }),
                borderColor: getPhaseColor(phase),
              },
            ]}
          />
        </>
      )}

      {/* Main Timer Circle */}
      <Animated.View
        style={[
          styles.timerCircle,
          {
            transform: [
              { scale: pulseAnim },
              { rotate: reduceMotion ? "0deg" : wobbleRotate },
            ],
            borderColor: getPhaseColor(phase),
          },
        ]}
      >
        {/* Progress Ring */}
        <View style={styles.progressRing}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getPhaseColor(phase) + "30",
                transform: [{ scaleY: progress }],
              },
            ]}
          />
        </View>

        {/* Timer Text */}
        <ThemedText style={styles.timerText}>
          {formatTime(timeRemaining)}
        </ThemedText>

        {/* Phase Label */}
        {isRunning && (
          <View
            style={[
              styles.phaseLabel,
              { backgroundColor: getPhaseColor(phase) },
            ]}
          >
            <ThemedText style={styles.phaseLabelText}>
              {phase.toUpperCase()}
            </ThemedText>
          </View>
        )}
      </Animated.View>

      {/* Audio Amplitude Indicator (mocked for Expo Go) */}
      {isRunning && !reduceMotion && (
        <Animated.View
          style={[
            styles.amplitudeIndicator,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [adjustedPulseMin, adjustedPulseMax],
                outputRange: [0.3, 0.8],
              }),
              backgroundColor: getPhaseColor(phase),
            },
          ]}
        />
      )}
    </View>
  );
}

function getPhaseColor(phase: Phase): string {
  switch (phase) {
    case "settle":
      return "#3498DB"; // Blue
    case "peak":
      return "#E74C3C"; // Red
    case "cool":
      return "#2ECC71"; // Green
    case "complete":
      return "#27AE60"; // Dark Green
    default:
      return Colors.light.primary;
  }
}

const TIMER_SIZE = Math.min(SCREEN_WIDTH * 0.6, 240);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: TIMER_SIZE + 80,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TIMER_SIZE,
  },
  ring: {
    position: "absolute",
    width: TIMER_SIZE + 40,
    height: TIMER_SIZE + 40,
    borderRadius: (TIMER_SIZE + 40) / 2,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  ringInner: {
    width: TIMER_SIZE + 20,
    height: TIMER_SIZE + 20,
    borderRadius: (TIMER_SIZE + 20) / 2,
  },
  timerCircle: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    backgroundColor: Colors.light.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  progressRing: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    transformOrigin: "bottom",
  },
  timerText: {
    fontSize: TIMER_SIZE * 0.25,
    fontWeight: "bold",
    color: Colors.light.text,
    fontVariant: ["tabular-nums"],
  },
  phaseLabel: {
    position: "absolute",
    bottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phaseLabelText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  amplitudeIndicator: {
    position: "absolute",
    bottom: 10,
    width: 60,
    height: 4,
    borderRadius: 2,
  },
});
