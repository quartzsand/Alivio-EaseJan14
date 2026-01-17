// client/screens/SessionScreen.tsx - COMPLETE FILE WITH ALL FEATURES
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as KeepAwake from "expo-keep-awake";

import { SensoryService, SensorySession } from "../services/SensoryService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Phase timing configuration for different durations
const PHASE_CONFIGS = {
  18: { prep: 3, active: 12, cool: 3 },
  24: { prep: 4, active: 16, cool: 4 },
  30: { prep: 5, active: 20, cool: 5 },
};

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  // Get parameters from navigation
  const { preferences } = route.params || {};
  const sessionDuration = preferences?.defaultDuration || 24;
  const selectedSite = preferences?.preferredSite || "thigh";

  // Initialize sensory service properly
  const [sensoryService] = useState(() => new SensoryService());

  // Session state
  const [currentPhase, setCurrentPhase] = useState("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);

  // Animation values
  const dragonflyX = useRef(new Animated.Value(-100)).current;
  const dragonflyY = useRef(new Animated.Value(screenHeight * 0.33)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  const phaseConfig = PHASE_CONFIGS[sessionDuration] || PHASE_CONFIGS[24];

  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync();
    sensoryService.onPhaseChange = handlePhaseChange;

    return () => {
      KeepAwake.deactivateKeepAwake();
      handleStop();
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
        setPhaseTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && isRunning) {
      handleSessionComplete();
    }
  }, [isRunning, timeRemaining]);

  const handlePhaseChange = (
    previousPhase: string,
    newPhase: string,
    running: boolean,
  ) => {
    console.log(`Phase changed: ${previousPhase} -> ${newPhase}`);
    setCurrentPhase(newPhase);
    setIsRunning(running);

    // Set phase timing and trigger animations
    switch (newPhase) {
      case "prep":
        setPhaseTimeRemaining(phaseConfig.prep);
        startPrepAnimations();
        sensoryService.playAudioFeedback("start");
        break;
      case "active":
        setPhaseTimeRemaining(phaseConfig.active);
        startActiveAnimations();
        sensoryService.playAudioFeedback("phase");
        break;
      case "cool":
        setPhaseTimeRemaining(phaseConfig.cool);
        startCoolAnimations();
        break;
      case "complete":
        setPhaseTimeRemaining(0);
        startCompleteAnimations();
        sensoryService.playAudioFeedback("complete");
        break;
    }
  };

  const startSession = async () => {
    try {
      setSessionStartTime(new Date());
      setTimeRemaining(sessionDuration);
      setIsRunning(true);

      await sensoryService.startSession(sessionDuration, selectedSite);
      startDragonflyAnimation();
    } catch (error) {
      console.error("Error starting session:", error);
      Alert.alert("Error", "Failed to start session. Please try again.");
    }
  };

  const handleStop = () => {
    try {
      if (sensoryService && typeof sensoryService.stop === "function") {
        sensoryService.stop();
      }

      setIsRunning(false);
      setCurrentPhase("idle");
      setTimeRemaining(sessionDuration);
      setPhaseTimeRemaining(0);

      resetAnimations();
    } catch (error) {
      console.error("Error stopping session:", error);
    }
  };

  const handleSessionComplete = async () => {
    try {
      handleStop();

      if (sessionStartTime) {
        const session: SensorySession = {
          id: Date.now().toString(),
          startTime: sessionStartTime.toISOString(),
          duration: sessionDuration,
          site: selectedSite,
          intensity: preferences?.vibrationIntensity || 0.7,
          completedSuccessfully: true,
        };

        await sensoryService.saveSession(session);
      }

      Alert.alert(
        "Session Complete! 🎉",
        `Great job completing your ${sessionDuration}-second comfort session at your ${selectedSite}!`,
        [
          {
            text: "Rate Experience",
            onPress: () => showRatingDialog(),
          },
          {
            text: "Done",
            onPress: () => navigation.goBack(),
            style: "cancel",
          },
        ],
      );
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  const showRatingDialog = () => {
    Alert.alert(
      "How was your session?",
      "Your feedback helps us improve the experience",
      [
        { text: "Great! 😊", onPress: () => navigation.goBack() },
        { text: "Good 👍", onPress: () => navigation.goBack() },
        { text: "Could be better 🤔", onPress: () => navigation.goBack() },
      ],
    );
  };

  // Animation functions
  const startDragonflyAnimation = () => {
    // Reset position
    dragonflyX.setValue(-100);
    dragonflyY.setValue(screenHeight * 0.33);

    // Main flight across screen
    Animated.timing(dragonflyX, {
      toValue: screenWidth + 100,
      duration: sessionDuration * 1000,
      useNativeDriver: true,
    }).start();

    // Wing flutter animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rotateValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startPrepAnimations = () => {
    // Gentle background fade to light blue
    Animated.timing(backgroundOpacity, {
      toValue: 0.3,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Gentle vertical movement for dragonfly
    Animated.loop(
      Animated.sequence([
        Animated.timing(dragonflyY, {
          toValue: screenHeight * 0.33 - 15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(dragonflyY, {
          toValue: screenHeight * 0.33 + 15,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startActiveAnimations = () => {
    // Background to green with pulse effect
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0.6,
        duration: 1000,
        useNativeDriver: false,
      }),
      // Gentle scale pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();

    // More energetic dragonfly movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(dragonflyY, {
          toValue: screenHeight * 0.33 - 25,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dragonflyY, {
          toValue: screenHeight * 0.33 + 20,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startCoolAnimations = () => {
    // Fade to cool purple
    Animated.timing(backgroundOpacity, {
      toValue: 0.4,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Dragonfly settles down
    Animated.timing(dragonflyY, {
      toValue: screenHeight * 0.33 + 30,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  };

  const startCompleteAnimations = () => {
    // Success celebration
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1.0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Dragonfly lands
    Animated.timing(dragonflyY, {
      toValue: screenHeight * 0.33 + 40,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const resetAnimations = () => {
    // Stop all animations
    dragonflyX.stopAnimation();
    dragonflyY.stopAnimation();
    backgroundOpacity.stopAnimation();
    scaleValue.stopAnimation();
    rotateValue.stopAnimation();

    // Reset values
    dragonflyX.setValue(-100);
    dragonflyY.setValue(screenHeight * 0.33);
    backgroundOpacity.setValue(0);
    scaleValue.setValue(1);
    rotateValue.setValue(0);
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case "prep":
        return "rgba(52, 152, 219, 0.3)"; // Blue
      case "active":
        return "rgba(46, 204, 113, 0.6)"; // Green
      case "cool":
        return "rgba(155, 89, 182, 0.4)"; // Purple
      case "complete":
        return "rgba(241, 196, 15, 0.5)"; // Yellow
      default:
        return "rgba(0, 0, 0, 0)"; // Transparent
    }
  };

  const getPhaseDescription = () => {
    switch (currentPhase) {
      case "prep":
        return "Getting ready... Relax and breathe 🔵";
      case "active":
        return "Perfect time for injection! 💚";
      case "cool":
        return "Cooling down... Almost finished 💜";
      case "complete":
        return "All finished! Great job! 🎉";
      default:
        return "Ready to start your comfort session";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSiteEmoji = (site: string) => {
    const siteEmojis = {
      finger: "👆",
      "upper-arm": "💪",
      thigh: "🦵",
      abdomen: "🤰",
    };
    return siteEmojis[site] || "🎯";
  };

  const getProgressPercentage = () => {
    return Math.max(0, (1 - timeRemaining / sessionDuration) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <Animated.View
        style={[
          styles.backgroundOverlay,
          {
            backgroundColor: getPhaseColor(),
            opacity: backgroundOpacity,
          },
        ]}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isRunning} // Prevent leaving during session
        >
          <Feather
            name="x"
            size={24}
            color={isRunning ? "#BDC3C7" : "#2C3E50"}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {getSiteEmoji(selectedSite)}{" "}
          {selectedSite.charAt(0).toUpperCase() + selectedSite.slice(1)} •{" "}
          {sessionDuration}s
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Timer Display */}
        <Animated.View
          style={[
            styles.timerContainer,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.phaseText}>
            {currentPhase.toUpperCase()}
            {phaseTimeRemaining > 0 && (
              <Text style={styles.phaseTimer}>
                {" "}
                • {phaseTimeRemaining}s left in phase
              </Text>
            )}
          </Text>
        </Animated.View>

        {/* Dragonfly Animation */}
        <Animated.View
          style={[
            styles.dragonflyContainer,
            {
              transform: [
                { translateX: dragonflyX },
                { translateY: dragonflyY },
                {
                  rotateZ: rotateValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "15deg"],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.dragonflyEmoji}>🦋</Text>
        </Animated.View>

        {/* Session Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getPhaseDescription()}</Text>

          {currentPhase !== "idle" && (
            <View style={styles.phaseProgressContainer}>
              <View style={styles.phaseProgressBar}>
                <Animated.View
                  style={[
                    styles.phaseProgress,
                    {
                      width: `${getProgressPercentage()}%`,
                      backgroundColor:
                        currentPhase === "active" ? "#2ECC71" : "#3498DB",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(getProgressPercentage())}% complete
              </Text>
            </View>
          )}

          {/* Phase indicators */}
          {currentPhase !== "idle" && (
            <View style={styles.phaseIndicators}>
              <View
                style={[
                  styles.phaseIndicator,
                  currentPhase === "prep" && styles.activePhaseIndicator,
                ]}
              >
                <Text style={styles.phaseIndicatorText}>PREP</Text>
              </View>
              <View
                style={[
                  styles.phaseIndicator,
                  currentPhase === "active" && styles.activePhaseIndicator,
                ]}
              >
                <Text style={styles.phaseIndicatorText}>ACTIVE</Text>
              </View>
              <View
                style={[
                  styles.phaseIndicator,
                  currentPhase === "cool" && styles.activePhaseIndicator,
                ]}
              >
                <Text style={styles.phaseIndicatorText}>COOL</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Feather name="play" size={24} color="white" />
            <Text style={styles.startButtonText}>
              Start {sessionDuration}s Session
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Feather name="square" size={24} color="white" />
            <Text style={styles.stopButtonText}>Stop Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  timerText: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
  },
  phaseText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7F8C8D",
    letterSpacing: 2,
    marginTop: 8,
    textAlign: "center",
  },
  phaseTimer: {
    fontSize: 12,
    letterSpacing: 1,
  },
  dragonflyContainer: {
    position: "absolute",
    zIndex: 10,
  },
  dragonflyEmoji: {
    fontSize: 40,
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34495E",
    marginBottom: 16,
    textAlign: "center",
  },
  phaseProgressContainer: {
    width: 240,
    alignItems: "center",
    marginBottom: 20,
  },
  phaseProgressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#ECF0F1",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  phaseProgress: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  phaseIndicators: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
  },
  phaseIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#ECF0F1",
  },
  activePhaseIndicator: {
    backgroundColor: "#3498DB",
  },
  phaseIndicatorText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2ECC71",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: "#2ECC71",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
});
