import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Image, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { DragonflyFlight } from "@/components/DragonflyFlight";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { SensoryEngine } from "@/services/SensoryEngine";
import { useSessionAudio } from "@/hooks/useSessionAudio";
import { useLofiLoop } from "@/hooks/useLofiLoop";
import { useApp } from "@/context/AppContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { HapticPattern } from "@/types";
import { HAPTIC_PATTERN_LABELS } from "@/types";


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PATTERNS: HapticPattern[] = ["standard", "gentle-wave", "soft-pulse"];
const DEFAULT_DURATION = 60;

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { preferences } = useApp();
  const { playStartSound, playCompleteSound } = useSessionAudio(preferences.audioEnabled);
  const { start: startLofi, stop: stopLofi, positionMs: lofiPositionMs } = useLofiLoop(preferences.audioEnabled, 0.38);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<HapticPattern>("standard");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const cycle = timeElapsed % 24;
  const dragonflyPhase = !isRunning ? "idle" : cycle < 12 ? "settle" : cycle < 18 ? "peak" : "cool";
  const carrierBase = selectedPattern === "standard" ? 26 : selectedPattern === "gentle-wave" ? 18 : 22;
  const dragonflyCarrierDensity = carrierBase * (0.7 + 0.7 * preferences.hapticIntensity);
  const dragonflyIntensity = preferences.hapticIntensity;

  useEffect(() => {
    SensoryEngine.setIntensity(preferences.hapticIntensity);
  }, [preferences.hapticIntensity]);

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
      ])
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
      ])
    ).start();

    return () => {
      SensoryEngine.cleanup();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      try {
        deactivateKeepAwake();
      } catch (e) {
        // Keep awake may not have been activated
      }
    };
  }, []);

  const startSession = useCallback(async () => {
    try {
      await activateKeepAwakeAsync();
    } catch (e) {
      console.log("Keep awake not available");
    }
    
    setIsRunning(true);
    
    if (preferences.audioEnabled) {
      await playStartSound();
      await startLofi();
    }
    await SensoryEngine.playStartSound();
    
    await SensoryEngine.startPattern(selectedPattern);
    
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  }, [selectedPattern, preferences.audioEnabled, playStartSound]);

  const stopSession = useCallback(async () => {
    await stopLofi();
    setIsRunning(false);
    SensoryEngine.stopPattern();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    try {
      deactivateKeepAwake();
    } catch (e) {
      // Keep awake may not have been activated
    }
    
    if (preferences.audioEnabled) {
      await playCompleteSound();
    }
    await SensoryEngine.playCompleteSound();
    
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [preferences.audioEnabled, playCompleteSound, stopLofi]);

  const handleEndSession = useCallback(async () => {
    await stopSession();
    navigation.replace("ComfortRating", {
      duration: timeElapsed,
      hapticPattern: selectedPattern,
    });
  }, [stopSession, navigation, timeElapsed, selectedPattern]);

  const handleClose = useCallback(() => {
    if (isRunning || timeElapsed > 0) {
      Alert.alert(
        "End Session?",
        "Your progress will be saved. Are you sure you want to end this session?",
        [
          { text: "Continue", style: "cancel" },
          {
            text: "End Session",
            onPress: handleEndSession,
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [isRunning, timeElapsed, handleEndSession, navigation]);

  const handlePatternChange = async (pattern: HapticPattern) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPattern(pattern);
    
    if (isRunning) {
      SensoryEngine.stopPattern();
      await SensoryEngine.startPattern(pattern);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const aliTranslateY = aliAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <LinearGradient
      colors={[Colors.light.primary + "15", Colors.light.accent + "20", Colors.light.background]}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={handleClose}
          testID="button-close"
        >
          <Feather name="x" size={24} color={Colors.light.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <ThemedText style={styles.timer}>{formatTime(timeElapsed)}</ThemedText>
        </Animated.View>

        <DragonflyFlight
          variant={(preferences.dragonflyVariant ?? "blue") as any}
          phase={dragonflyPhase as any}
          intensity={dragonflyIntensity}
          carrierDensity={dragonflyCarrierDensity}
          musicPositionMs={lofiPositionMs}
          style={styles.dragonflyOverlay}
        />


        <ThemedText style={styles.patternLabel}>
          {isRunning ? `Playing: ${HAPTIC_PATTERN_LABELS[selectedPattern]}` : "Select a pattern"}
        </ThemedText>

        <View style={styles.patternSelector}>
          {PATTERNS.map((pattern) => (
            <Pressable
              key={pattern}
              style={({ pressed }) => [
                styles.patternButton,
                selectedPattern === pattern && styles.patternButtonSelected,
                pressed && styles.patternButtonPressed,
              ]}
              onPress={() => handlePatternChange(pattern)}
              testID={`pattern-${pattern}`}
            >
              <ThemedText
                style={[
                  styles.patternButtonText,
                  selectedPattern === pattern && styles.patternButtonTextSelected,
                ]}
              >
                {HAPTIC_PATTERN_LABELS[pattern]}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}>
        {!isRunning ? (
          <Pressable
            style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
            onPress={startSession}
            testID="button-start"
          >
            <Feather name="play" size={24} color={Colors.light.buttonText} />
            <ThemedText style={styles.startButtonText}>Start</ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.endButton, pressed && styles.endButtonPressed]}
            onPress={handleEndSession}
            testID="button-end"
          >
            <Feather name="check" size={24} color={Colors.light.buttonText} />
            <ThemedText style={styles.endButtonText}>End Session</ThemedText>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  timerContainer: {
    marginBottom: Spacing["2xl"],
  },
  timer: {
    fontSize: 72,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: "Nunito_700Bold",
  },
  aliContainer: {
    width: 180,
    height: 180,
    marginBottom: Spacing["2xl"],
  },
  aliImage: {
    width: "100%",
    height: "100%",
  },
  patternLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  patternSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  patternButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  patternButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  patternButtonPressed: {
    opacity: 0.7,
  },
  patternButtonText: {
    ...Typography.caption,
    color: Colors.light.text,
  },
  patternButtonTextSelected: {
    color: Colors.light.buttonText,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  startButtonPressed: {
    opacity: 0.7,
  },
  startButtonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
    marginLeft: Spacing.sm,
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  endButtonPressed: {
    opacity: 0.7,
  },
  endButtonText: {
    ...Typography.button,
    color: Colors.light.text,
    marginLeft: Spacing.sm,
  },
});
