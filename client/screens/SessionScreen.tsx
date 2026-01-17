// client/screens/SessionScreen.tsx
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

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  // Get parameters from navigation
  const { preferences, getSiteTuning } = route.params || {};

  // Initialize sensory service properly
  const [sensoryService] = useState(() => new SensoryService());

  // Session state
  const [currentPhase, setCurrentPhase] = useState("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Animation values
  const dragonflyX = useRef(new Animated.Value(-100)).current; // Start off-screen left
  const dragonflyY = useRef(new Animated.Value(screenHeight * 0.33)).current; // 2/3 up from bottom
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Session configuration
  const sessionDuration = preferences?.defaultDuration || 60;
  const selectedSite = preferences?.preferredSite || "thigh";

  useEffect(() => {
    // Keep screen awake during session
    KeepAwake.activateKeepAwakeAsync();

    // Set up phase change listener
    sensoryService.onPhaseChange = handlePhaseChange;

    // Cleanup
    return () => {
      KeepAwake.deactivateKeepAwake();
      handleStop();
    };
  }, []);

  useEffect(() => {
    // Start countdown timer
    if (isRunning && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
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

    // Update animations based on phase
    switch (newPhase) {
      case "prep":
        startPrepAnimations();
        break;
      case "active":
        startActiveAnimations();
        break;
      case "cool":
        startCoolAnimations();
        break;
      case "complete":
        startCompleteAnimations();
        break;
    }
  };

  const startSession = async () => {
    try {
      setSessionStartTime(new Date());
      setTimeRemaining(sessionDuration);
      setIsRunning(true);

      // Start the sensory service
      await sensoryService.startSession(sessionDuration, selectedSite);

      // Start dragonfly animation
      startDragonflyAnimation();
    } catch (error) {
      console.error("Error starting session:", error);
      Alert.alert("Error", "Failed to start session. Please try again.");
    }
  };

  const handleStop = () => {
    try {
      console.log("Stopping session...");

      // Stop sensory service safely
      if (sensoryService && typeof sensoryService.stop === "function") {
        sensoryService.stop();
      }

      // Reset state
      setIsRunning(false);
      setCurrentPhase("idle");
      setTimeRemaining(sessionDuration);

      // Reset animations
      resetAnimations();
    } catch (error) {
      console.error("Error stopping session:", error);
    }
  };

  const handleSessionComplete = async () => {
    try {
      // Stop the service
      handleStop();

      // Save session data
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

      // Show completion message
      Alert.alert("Session Complete!", "Great job! How do you feel?", [
        {
          text: "Done",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  // Animation functions
  const startDragonflyAnimation = () => {
    // Reset position
    dragonflyX.setValue(-100); // Start off-screen left
    dragonflyY.setValue(screenHeight * 0.33); // 2/3 up screen

    // Animate across screen
    Animated.timing(dragonflyX, {
      toValue: screenWidth + 100, // End off-screen right
      duration: sessionDuration * 1000, // Duration matches session
      useNativeDriver: true,
    }).start(() => {
      // Animation complete - reset if needed
      if (!isRunning) {
        resetAnimations();
      }
    });
  };

  const startPrepAnimations = () => {
    // Gentle background fade to light blue
    Animated.timing(backgroundOpacity, {
      toValue: 0.3,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  };

  const startActiveAnimations = () => {
    // Background to green, slight scale pulse
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0.6,
        duration: 1000,
        useNativeDriver: false,
      }),
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
  };

  const startCoolAnimations = () => {
    // Fade to cool blue
    Animated.timing(backgroundOpacity, {
      toValue: 0.4,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  };

  const startCompleteAnimations = () => {
    // Success animation - burst effect could be added here
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
  };

  const resetAnimations = () => {
    // Stop all animations
    dragonflyX.stopAnimation();
    backgroundOpacity.stopAnimation();
    scaleValue.stopAnimation();

    // Reset values
    dragonflyX.setValue(-100);
    dragonflyY.setValue(screenHeight * 0.33);
    backgroundOpacity.setValue(0);
    scaleValue.setValue(1);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        >
          <Feather name="x" size={24} color="#2C3E50" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedSite.charAt(0).toUpperCase() + selectedSite.slice(1)} Session
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
          <Text style={styles.phaseText}>{currentPhase.toUpperCase()}</Text>
        </Animated.View>

        {/* Dragonfly Animation */}
        <Animated.View
          style={[
            styles.dragonflyContainer,
            {
              transform: [
                { translateX: dragonflyX },
                { translateY: dragonflyY },
              ],
            },
          ]}
        >
          <Text style={styles.dragonflyEmoji}>🦋</Text>
        </Animated.View>

        {/* Session Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isRunning ? "Session Active" : "Ready to Start"}
          </Text>
          {isRunning && (
            <Text style={styles.instructionText}>
              {currentPhase === "active"
                ? "💚 Perfect time for injection!"
                : "⏳ Get ready..."}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
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
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: "#2ECC71",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  stopButton: {
    backgroundColor: "#E74C3C",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
});
