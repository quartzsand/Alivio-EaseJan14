// client/screens/SessionScreen.tsx
// FINAL VERSION: Integrated with VisualBreathingTimer, DragonflyFlight, and full phase management
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { ThemedText } from "@/components/ThemedText";
import { DragonflyFlight } from "@/components/DragonflyFlight";
import { VisualBreathingTimer } from "@/components/VisualBreathingTimer";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { sensoryService } from "@/services/SensoryService";
import { useApp } from "@/context/AppContext";

import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { HapticPattern, SessionDuration } from "@/types";
import { SESSION_PHASE_PRESETS } from "@/types";
import type { SensoryProfile, TextureVariation } from "@/services/audio/ExpoAVAudioEngine";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SessionRouteProp = RouteProp<RootStackParamList, "Session">;

type SessionPhase = "idle" | "settle" | "peak" | "cool" | "complete";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SessionRouteProp>();
  const { preferences, getSiteTuning, addSession } = useApp();

  // Get session parameters from route or preferences
  const site = route.params?.site;
  const duration: SessionDuration =
    (route.params?.duration as SessionDuration) ||
    preferences.selectedDuration ||
    24;

  // Phase timing configuration
  const phases = SESSION_PHASE_PRESETS[duration];
  const totalDuration = phases.settle + phases.peak + phases.cool;

  // Get site-specific tuning or use defaults
  const siteTuning = site ? getSiteTuning(site) : undefined;

  const effectiveIntensity =
    siteTuning?.hapticIntensity ?? preferences.hapticIntensity;
  const effectiveSnapDensity =
    siteTuning?.snapDensity ?? preferences.snapDensity;
  const effectivePeakStyle = siteTuning?.peakStyle ?? preferences.peakStyle;
  const effectiveAudioVolume =
    siteTuning?.audioVolume ?? preferences.audioVolume;

  // Sensory profile settings (could come from route or preferences)
  const sensoryProfile: SensoryProfile =
    (route.params as any)?.sensoryProfile || "edge";
  const textureVariation: TextureVariation =
    (route.params as any)?.textureVariation || "constantflow";

  // Session state
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("idle");
  const [selectedPattern, setSelectedPattern] =
    useState<HapticPattern>("standard");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // Music position for dragonfly sync
  const [musicPositionMs, setMusicPositionMs] = useState(0);

  // Poll music position while running (10 Hz)
  useEffect(() => {
    if (!isRunning) return;

    let cancelled = false;

    const id = setInterval(async () => {
      try {
        const ms = await sensoryService.getMusicPositionMs();
        if (!cancelled) setMusicPositionMs(ms);
      } catch {
        // ignore
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isRunning]);

  // Determine session phase from elapsed time
  useEffect(() => {
    if (!isRunning) {
      setCurrentPhase("idle");
      return;
    }

    if (timeElapsed < phases.settle) setCurrentPhase("settle");
    else if (timeElapsed < phases.settle + phases.peak) setCurrentPhase("peak");
    else if (timeElapsed < totalDuration) setCurrentPhase("cool");
    else setCurrentPhase("complete");
  }, [isRunning, timeElapsed, phases, totalDuration]);

  // Auto-end when complete
  useEffect(() => {
    if (currentPhase === "complete" && isRunning) {
      void handleEndSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, isRunning]);

  // Inform haptics engine when phase changes
  useEffect(() => {
    if (!isRunning) return;
    if (currentPhase === "idle" || currentPhase === "complete") return;

    sensoryService.updatePhase(
      currentPhase === "cool" ? "coolDown" : currentPhase
    );
  }, [currentPhase, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        deactivateKeepAwake();
      } catch {}
      void sensoryService.stop();
    };
  }, []);

  // Dragonfly alignment logic (phase-aware)
  const beatBpm = 80;
  const beatPeriodMs = 60000 / beatBpm;

  const phaseProgress01 = useMemo(() => {
    if (!isRunning) return 0;
    if (currentPhase === "settle") return clamp01(timeElapsed / phases.settle);
    if (currentPhase === "peak")
      return clamp01((timeElapsed - phases.settle) / phases.peak);
    if (currentPhase === "cool")
      return clamp01((timeElapsed - phases.settle - phases.peak) / phases.cool);
    return 0;
  }, [isRunning, currentPhase, timeElapsed, phases]);

  const dragonflyPhase = useMemo(() => {
    if (currentPhase === "settle") return "settle";
    if (currentPhase === "peak") return "peak";
    if (currentPhase === "cool") return "cool";
    return "idle";
  }, [currentPhase]);

  const beatPhase01 = useMemo(() => {
    if (!musicPositionMs) return 0;
    return (musicPositionMs % beatPeriodMs) / beatPeriodMs;
  }, [musicPositionMs, beatPeriodMs]);

  const dragonflyIntensity01 = useMemo(() => {
    const user = clamp01(effectiveIntensity);

    if (!isRunning) return 0.15;

    if (currentPhase === "settle") {
      const base = lerp(0.35, 0.75, phaseProgress01);
      return clamp01(base * (0.75 + 0.35 * user));
    }

    if (currentPhase === "peak") {
      const tremor = 0.06 * Math.sin(Math.PI * 2 * beatPhase01);
      const base = 0.92 + tremor;
      return clamp01(base * (0.8 + 0.3 * user));
    }

    if (currentPhase === "cool") {
      const base = lerp(0.7, 0.3, phaseProgress01);
      return clamp01(base * (0.85 + 0.25 * user));
    }

    return 0.2;
  }, [
    isRunning,
    currentPhase,
    phaseProgress01,
    beatPhase01,
    effectiveIntensity,
  ]);

  const dragonflyCarrierDensity = useMemo(() => {
    const patternBase =
      selectedPattern === "standard"
        ? 26
        : selectedPattern === "gentle-wave"
          ? 18
          : 22;

    const user = clamp01(effectiveIntensity);
    const snap = clamp01(effectiveSnapDensity);

    const phaseMul =
      currentPhase === "peak"
        ? 1.25
        : currentPhase === "settle"
          ? 1.0
          : currentPhase === "cool"
            ? 0.85
            : 0.8;

    const snapMul = 0.85 + 0.55 * snap;
    const intMul = 0.75 + 0.55 * user;

    return patternBase * phaseMul * snapMul * intMul;
  }, [selectedPattern, currentPhase, effectiveIntensity, effectiveSnapDensity]);

  // Session handlers
  const startSession = useCallback(async () => {
    try {
      await activateKeepAwakeAsync();
    } catch {
      console.log("Keep awake not available");
    }

    setIsRunning(true);
    setTimeElapsed(0);
    setCurrentPhase("settle");
    sessionStartTimeRef.current = new Date();

    // Play start sound
    if (preferences.audioEnabled) {
      await sensoryService.playUISound("ui_start");
    }

    // Start sensory session with full configuration
    await sensoryService.startSession({
      pattern: selectedPattern,
      phase: "settle",
      audioEnabled: preferences.audioEnabled,
      hapticsIntensity01: effectiveIntensity,
      audioVolume01: effectiveAudioVolume,
      peakStyle: effectivePeakStyle,
      snapDensity01: effectiveSnapDensity,
      useAdvancedHaptics: preferences.useAdvancedHaptics ?? false,
      sensoryProfile,
      textureVariation,
      sessionDuration: duration,
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  }, [
    preferences,
    selectedPattern,
    effectiveIntensity,
    effectiveAudioVolume,
    effectivePeakStyle,
    effectiveSnapDensity,
    sensoryProfile,
    textureVariation,
    duration,
  ]);

  const handleEndSession = useCallback(async () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop sensory service
    await sensoryService.stop();

    // Play completion sound
    if (preferences.audioEnabled) {
      await sensoryService.playUISound("ui_complete");
    }

    try {
      deactivateKeepAwake();
    } catch {}

    setIsRunning(false);
    setCurrentPhase("complete");

    // Save session to history
    if (sessionStartTimeRef.current) {
      await addSession({
        id: Date.now().toString(),
        date: sessionStartTimeRef.current.toISOString(),
        duration,
        hapticPattern: selectedPattern,
        comfortRating: 4, // Default - could show rating modal
        site: site,
      });
    }

    // Navigate to comfort rating or show completion alert
    Alert.alert(
      "Session Complete! 🎉",
      `Great job completing your ${duration}-second comfort session!`,
      [
        {
          text: "Rate Experience",
          onPress: () => {
            navigation.navigate("ComfortRating", {
              sessionId: Date.now().toString(),
              duration,
              hapticPattern: selectedPattern,
              site,
            });
          },
        },
        {
          text: "Done",
          onPress: () => navigation.goBack(),
          style: "cancel",
        },
      ]
    );
  }, [preferences, duration, selectedPattern, site, addSession, navigation]);

  const handleCancelSession = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await sensoryService.stop();

    try {
      deactivateKeepAwake();
    } catch {}

    setIsRunning(false);
    setTimeElapsed(0);
    setCurrentPhase("idle");
  }, []);

  const timeRemaining = Math.max(0, totalDuration - timeElapsed);

  // Phase colors for gradient
  const getPhaseColors = (): [string, string] => {
    switch (currentPhase) {
      case "settle":
        return ["#E3F2FD", "#BBDEFB"];
      case "peak":
        return ["#FFEBEE", "#FFCDD2"];
      case "cool":
        return ["#E8F5E9", "#C8E6C9"];
      default:
        return ["#F8F9FA", "#E8EAED"];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getPhaseColors()}
        style={StyleSheet.absoluteFill}
      />

      {/* Dragonfly Animation */}
      {isRunning && (
        <DragonflyFlight
          variant={preferences.dragonflyVariant}
          phase={dragonflyPhase}
          intensity={dragonflyIntensity01}
          carrierDensity={dragonflyCarrierDensity}
          musicPositionMs={musicPositionMs}
          style={styles.dragonfly}
        />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (isRunning) {
              Alert.alert(
                "End Session?",
                "Are you sure you want to end your session early?",
                [
                  { text: "Continue", style: "cancel" },
                  {
                    text: "End Session",
                    style: "destructive",
                    onPress: async () => {
                      await handleCancelSession();
                      navigation.goBack();
                    },
                  },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <Feather name="x" size={24} color={Colors.light.text} />
        </Pressable>

        <ThemedText style={styles.headerTitle}>
          {site
            ? `${site.charAt(0).toUpperCase() + site.slice(1)} • ${duration}s`
            : `${duration}s Session`}
        </ThemedText>

        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Breathing Timer - Main Feature */}
        <VisualBreathingTimer
          timeRemaining={timeRemaining}
          totalDuration={totalDuration}
          phase={currentPhase}
          intensity={effectiveIntensity}
          isRunning={isRunning}
          musicPositionMs={musicPositionMs}
          reduceMotion={false}
        />

        {/* Phase Progress Indicators */}
        {isRunning && (
          <View style={styles.phaseIndicators}>
            <View style={styles.phaseRow}>
              {["settle", "peak", "cool"].map((phase) => (
                <View
                  key={phase}
                  style={[
                    styles.phaseIndicator,
                    currentPhase === phase && styles.phaseIndicatorActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.phaseIndicatorText,
                      currentPhase === phase && styles.phaseIndicatorTextActive,
                    ]}
                  >
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(timeElapsed / totalDuration) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Pattern Selection (when not running) */}
        {!isRunning && (
          <View style={styles.patternSection}>
            <ThemedText style={styles.sectionLabel}>Haptic Pattern</ThemedText>
            <View style={styles.patternButtons}>
              {(["standard", "gentle-wave", "soft-pulse"] as HapticPattern[]).map(
                (pattern) => (
                  <Pressable
                    key={pattern}
                    style={[
                      styles.patternButton,
                      selectedPattern === pattern && styles.patternButtonActive,
                    ]}
                    onPress={() => setSelectedPattern(pattern)}
                  >
                    <Feather
                      name={
                        pattern === "standard"
                          ? "activity"
                          : pattern === "gentle-wave"
                            ? "wind"
                            : "heart"
                      }
                      size={18}
                      color={
                        selectedPattern === pattern
                          ? "#FFFFFF"
                          : Colors.light.text
                      }
                    />
                    <ThemedText
                      style={[
                        styles.patternButtonText,
                        selectedPattern === pattern &&
                          styles.patternButtonTextActive,
                      ]}
                    >
                      {pattern === "standard"
                        ? "Standard"
                        : pattern === "gentle-wave"
                          ? "Gentle"
                          : "Pulse"}
                    </ThemedText>
                  </Pressable>
                )
              )}
            </View>

            {/* Session Info */}
            <View style={styles.sessionInfo}>
              <View style={styles.infoRow}>
                <Feather name="clock" size={16} color={Colors.light.textSecondary} />
                <ThemedText style={styles.infoText}>
                  {phases.settle}s settle → {phases.peak}s peak → {phases.cool}s cool
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <Feather name="sliders" size={16} color={Colors.light.textSecondary} />
                <ThemedText style={styles.infoText}>
                  Intensity: {Math.round(effectiveIntensity * 100)}%
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {!isRunning ? (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={startSession}
          >
            <Feather name="play" size={28} color="#FFFFFF" />
            <ThemedText style={styles.startButtonText}>
              Start Session
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.stopButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleCancelSession}
          >
            <Feather name="square" size={24} color="#FFFFFF" />
            <ThemedText style={styles.stopButtonText}>Stop</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  dragonfly: {
    position: "absolute",
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  phaseIndicators: {
    width: "100%",
    maxWidth: 300,
    marginTop: Spacing.xl,
  },
  phaseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  phaseIndicator: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.border,
  },
  phaseIndicatorActive: {
    backgroundColor: Colors.light.primary,
  },
  phaseIndicatorText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  phaseIndicatorTextActive: {
    color: "#FFFFFF",
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
  },
  patternSection: {
    width: "100%",
    maxWidth: 340,
    marginTop: Spacing["2xl"],
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  patternButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  patternButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  patternButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  patternButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "500",
    color: Colors.light.text,
  },
  patternButtonTextActive: {
    color: "#FFFFFF",
  },
  sessionInfo: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2ECC71",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.md,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.md,
  },
  stopButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
