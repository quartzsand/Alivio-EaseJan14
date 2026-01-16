// client/screens/SessionScreen.tsx
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
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { ThemedText } from "@/components/ThemedText";
import { DragonflyFlight } from "@/components/DragonflyFlight";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { sensoryService } from "@/services/SensoryService";
import { useSessionAudio } from "@/hooks/useSessionAudio";
import { useApp } from "@/context/AppContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { HapticPattern } from "@/types";
import { SESSION_PHASE_PRESETS } from "@/types";

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

  const { preferences, getSiteTuning } = useApp();

  const site = route.params?.site;
  const duration = route.params?.duration || preferences.selectedDuration || 24;

  const phases = SESSION_PHASE_PRESETS[duration];
  const totalDuration = phases.settle + phases.peak + phases.cool;

  const siteTuning = site ? getSiteTuning(site) : undefined;

  const effectiveIntensity =
    siteTuning?.hapticIntensity ?? preferences.hapticIntensity;
  const effectiveSnapDensity =
    siteTuning?.snapDensity ?? preferences.snapDensity;
  const effectivePeakStyle = siteTuning?.peakStyle ?? preferences.peakStyle;
  const effectiveAudioVolume =
    siteTuning?.audioVolume ?? preferences.audioVolume;

  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("idle");
  const [selectedPattern, setSelectedPattern] =
    useState<HapticPattern>("standard");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation refs
  const aliAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Music position for sync
  const [musicPositionMs, setMusicPositionMs] = useState(0);

  const { playStartSound, playCompleteSound } = useSessionAudio(
    preferences.audioEnabled,
  );

  // Poll music position while running (10Hz)
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

  // Determine phase from elapsed seconds
  useEffect(() => {
    if (!isRunning) {
      setCurrentPhase("idle");
      return;
    }

    if (timeElapsed < phases.settle) setCurrentPhase("settle");
    else if (timeElapsed < phases.settle + phases.peak) setCurrentPhase("peak");
    else if (timeElapsed < totalDuration) setCurrentPhase("cool");
    else setCurrentPhase("complete");
  }, [timeElapsed, isRunning, phases, totalDuration]);

  // Auto-end when complete
  useEffect(() => {
    if (currentPhase === "complete" && isRunning) {
      void handleEndSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, isRunning]);

  // Update haptics engine when phase changes
  useEffect(() => {
    if (!isRunning) return;
    if (currentPhase === "idle" || currentPhase === "complete") return;
    sensoryService.updatePhase(
      currentPhase === "cool" ? "coolDown" : currentPhase,
    );
  }, [currentPhase, isRunning]);

  // Background animations (subtle UI)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(aliAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(aliAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        deactivateKeepAwake();
      } catch {}
      void sensoryService.stop();
    };
  }, [aliAnim, pulseAnim]);

  // -----------------------
  // Dragonfly alignment logic (12/6/6)
  // -----------------------

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
      // 12s ramp: 0.35 -> 0.75 (scaled by user)
      const base = lerp(0.35, 0.75, phaseProgress01);
      return clamp01(base * (0.75 + 0.35 * user));
    }

    if (currentPhase === "peak") {
      // 6s urgent: hover near 0.95 with beat-locked tremor
      const tremor = 0.06 * Math.sin(Math.PI * 2 * beatPhase01);
      const base = 0.92 + tremor;
      return clamp01(base * (0.8 + 0.3 * user));
    }

    if (currentPhase === "cool") {
      // 6s decay: 0.70 -> 0.30
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
    // Start from pattern base then scale by user intensity + snap density + phase
    const patternBase =
      selectedPattern === "standard"
        ? 26
        : selectedPattern === "gentle-wave"
          ? 18
          : 22;

    const user = clamp01(effectiveIntensity);
    const snap = clamp01(effectiveSnapDensity);

    // Phase multiplier: peak is most lively
    const phaseMul =
      currentPhase === "peak"
        ? 1.25
        : currentPhase === "settle"
          ? 1.0
          : currentPhase === "cool"
            ? 0.85
            : 0.8;

    // Snap density makes motion livelier, but keep bounded
    const snapMul = 0.85 + 0.55 * snap;

    // Intensity adds some liveliness
    const intMul = 0.75 + 0.55 * user;

    return patternBase * phaseMul * snapMul * intMul;
  }, [selectedPattern, currentPhase, effectiveIntensity, effectiveSnapDensity]);

  // -------------
  // Session handlers
  // -------------

  const startSession = useCallback(async () => {
    try {
      await activateKeepAwakeAsync();
    } catch {
      console.log("Keep awake not available");
    }

    setIsRunning(true);
    setTimeElapsed(0);
    setCurrentPhase("settle");

    if (preferences.audioEnabled) {
      await playStartSound();
    }

    // Start orchestrated audio + haptics (no direct HapticsService calls)
    await sensoryService.startSession({
      pattern: selectedPattern,
      phase: "settle",
      audioEnabled: preferences.audioEnabled,
      hapticsIntensity01: effectiveIntensity,
      audioVolume01: effectiveAudioVolume,
      peakStyle: effectivePeakStyle,
      snapDensity01: effectiveSnapDensity,
      useAdvancedHaptics: !!preferences.useAdvancedHaptics,
    });

    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  }, [
    selectedPattern,
    preferences.audioEnabled,
    preferences.useAdvancedHaptics,
    playStartSound,
    effectiveIntensity,
    effectiveAudioVolume,
    effectivePeakStyle,
    effectiveSnapDensity,
  ]);

  const stopSession = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await sensoryService.stop();
    setIsRunning(false);

    try {
      deactivateKeepAwake();
    } catch {}

    if (preferences.audioEnabled) {
      await playCompleteSound();
    }
  }, [preferences.audioEnabled, playCompleteSound]);

  const handleEndSession = useCallback(async () => {
    await stopSession();
    navigation.replace("ComfortRating", {
      duration: timeElapsed,
      hapticPattern: selectedPattern,
      site,
    });
  }, [stopSession, navigation, timeElapsed, selectedPattern, site]);

  const handleClose = useCallback(() => {
    if (isRunning || timeElapsed > 0) {
      Alert.alert(
        "End Session?",
        "Your progress will be saved. Are you sure you want to end this session?",
        [
          { text: "Continue", style: "cancel" },
          { text: "End Session", onPress: () => void handleEndSession() },
        ],
      );
    } else {
      navigation.goBack();
    }
  }, [isRunning, timeElapsed, handleEndSession, navigation]);

  // -------------
  // UI
  // -------------

  const dragonflyVariant = preferences.dragonflyVariant ?? "blue";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.bgTop, Colors.bgBottom]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable onPress={handleClose} style={styles.closeBtn}>
        <Feather name="x" size={22} color={Colors.text} />
      </Pressable>

      <View style={styles.header}>
        <ThemedText style={styles.title}>Session</ThemedText>
        <ThemedText style={styles.subtitle}>
          {isRunning
            ? `${timeElapsed}s / ${totalDuration}s`
            : `${totalDuration}s`}
        </ThemedText>
      </View>

      <View style={styles.stage}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.orb} />
        </Animated.View>

        <DragonflyFlight
          variant={dragonflyVariant}
          phase={dragonflyPhase as any}
          intensity={dragonflyIntensity01}
          carrierDensity={dragonflyCarrierDensity}
          musicPositionMs={musicPositionMs}
        />
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={
            isRunning
              ? () => void handleEndSession()
              : () => void startSession()
          }
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={styles.primaryBtnText}>
            {isRunning ? "End" : "Start"}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 10,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    fontSize: Typography.h1,
    color: Colors.text,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    fontSize: Typography.body,
    color: Colors.muted,
  },
  stage: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  orb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
