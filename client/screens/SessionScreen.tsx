import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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
import type { HapticPattern, SessionSite, SessionDuration } from "@/types";
import { HAPTIC_PATTERN_LABELS, SESSION_PHASE_PRESETS, SESSION_SITE_LABELS } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SessionRouteProp = RouteProp<RootStackParamList, 'Session'>;

const PATTERNS: HapticPattern[] = ["standard", "gentle-wave", "soft-pulse"];

type SessionPhase = 'idle' | 'settle' | 'peak' | 'cool' | 'complete';

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
  const effectiveIntensity = siteTuning?.hapticIntensity ?? preferences.hapticIntensity;
  const effectiveSnapDensity = siteTuning?.snapDensity ?? preferences.snapDensity;
  const effectivePeakStyle = siteTuning?.peakStyle ?? preferences.peakStyle;
  const effectiveAudioVolume = siteTuning?.audioVolume ?? preferences.audioVolume;

  const { playStartSound, playCompleteSound } = useSessionAudio(preferences.audioEnabled);
  const { start: startLofi, stop: stopLofi, positionMs: lofiPositionMs } = useLofiLoop(preferences.audioEnabled, effectiveAudioVolume);
  
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>('idle');
  const [selectedPattern, setSelectedPattern] = useState<HapticPattern>("standard");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const dragonflyPhase = currentPhase === 'idle' ? 'idle' : 
                         currentPhase === 'settle' ? 'settle' : 
                         currentPhase === 'peak' ? 'peak' : 
                         currentPhase === 'cool' ? 'cool' : 'idle';

  const carrierBase = selectedPattern === "standard" ? 26 : selectedPattern === "gentle-wave" ? 18 : 22;
  const dragonflyCarrierDensity = carrierBase * (0.7 + 0.7 * effectiveIntensity) * (0.5 + effectiveSnapDensity);
  const dragonflyIntensity = effectiveIntensity;

  useEffect(() => {
    SensoryEngine.setIntensity(effectiveIntensity);
    SensoryEngine.setSnapDensity(effectiveSnapDensity);
    SensoryEngine.setPeakStyle(effectivePeakStyle);
  }, [effectiveIntensity, effectiveSnapDensity, effectivePeakStyle]);

  useEffect(() => {
    if (!isRunning) {
      setCurrentPhase('idle');
      return;
    }

    if (timeElapsed < phases.settle) {
      setCurrentPhase('settle');
    } else if (timeElapsed < phases.settle + phases.peak) {
      setCurrentPhase('peak');
    } else if (timeElapsed < totalDuration) {
      setCurrentPhase('cool');
    } else {
      setCurrentPhase('complete');
    }
  }, [timeElapsed, isRunning, phases, totalDuration]);

  useEffect(() => {
    if (currentPhase === 'complete' && isRunning) {
      handleEndSession();
    }
  }, [currentPhase, isRunning]);

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
    setTimeElapsed(0);
    setCurrentPhase('settle');
    
    if (preferences.audioEnabled) {
      await playStartSound();
      await startLofi();
    }
    await SensoryEngine.playStartSound();
    
    await SensoryEngine.startPattern(selectedPattern, 'settle');
    
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const next = prev + 1;
        return next;
      });
    }, 1000);
  }, [selectedPattern, preferences.audioEnabled, playStartSound, startLofi]);

  useEffect(() => {
    if (isRunning && currentPhase !== 'idle' && currentPhase !== 'complete') {
      SensoryEngine.updatePhase(currentPhase);
    }
  }, [currentPhase, isRunning]);

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
      site: site,
    });
  }, [stopSession, navigation, timeElapsed, selectedPattern, site]);

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
      await SensoryEngine.startPattern(pattern, currentPhase);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPhaseLabel = (): string => {
    switch (currentPhase) {
      case 'idle': return 'Ready';
      case 'settle': return 'Settling...';
      case 'peak': return 'Peak Comfort';
      case 'cool': return 'Cooling Down';
      case 'complete': return 'Complete';
      default: return '';
    }
  };

  const getPhaseProgress = (): number => {
    if (!isRunning) return 0;
    return Math.min(timeElapsed / totalDuration, 1);
  };

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

        {site && (
          <View style={styles.siteIndicator}>
            <Feather name="map-pin" size={14} color={Colors.light.textSecondary} />
            <ThemedText style={styles.siteText}>{SESSION_SITE_LABELS[site]}</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.phaseContainer}>
          <ThemedText style={styles.phaseLabel}>{getPhaseLabel()}</ThemedText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getPhaseProgress() * 100}%` }]} />
          </View>
          <ThemedText style={styles.phaseTiming}>
            {duration}s session ({phases.settle}/{phases.peak}/{phases.cool})
          </ThemedText>
        </View>

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

        {preferences.debugMode && (
          <View style={styles.debugInfo}>
            <ThemedText style={styles.debugText}>
              Phase: {currentPhase} | Intensity: {effectiveIntensity.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              Snap: {effectiveSnapDensity.toFixed(2)} | Peak: {effectivePeakStyle}
            </ThemedText>
          </View>
        )}
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
    justifyContent: "space-between",
    alignItems: "center",
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
  siteIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  siteText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  phaseContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    width: "100%",
  },
  phaseLabel: {
    ...Typography.title,
    color: Colors.light.primary,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    width: "80%",
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  phaseTiming: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
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
  dragonflyOverlay: {
    position: "absolute",
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
  debugInfo: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  debugText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontFamily: "monospace",
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
