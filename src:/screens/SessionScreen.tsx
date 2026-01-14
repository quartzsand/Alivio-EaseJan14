import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { sensoryEngine } from "../services/SensoryEngine";
import StorageService from "../services/StorageService";
import { COLORS } from "../constants/Colors";
import { DISCLAIMERS } from "../constants/DisclaimerText";

const { width } = Dimensions.get("window");

export default function SessionScreen({ navigation }: any) {
  const [duration, setDuration] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [selectedPattern, setSelectedPattern] = useState("standard");
  const [streak, setStreak] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.5);
      });
    }, 1000);
  };

  const handleStopSession = () => {
    sensoryEngine.stop();
    setIsActive(false);
    setTimeRemaining(duration);
  };

  const handleSessionComplete = async () => {
    sensoryEngine.stop();
    setIsActive(false);

    // Play success feedback
    await sensoryEngine.playSuccessHeartbeat();
    await sensoryEngine.playSuccessSound();

    // Navigate to comfort rating
    navigation.navigate("ComfortRating", {
      duration,
      pattern: selectedPattern,
      routineType: "SubQ",
    });
  };

  return (
    <LinearGradient
      colors={[COLORS.MEDICAL_BLUE, COLORS.SOFT_TEAL]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Alivio Ease</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Tagline */}
      <Text style={styles.tagline}>
        Supporting your self-care with calm confidence
      </Text>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>
            {String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:
            {String(timeRemaining % 60).padStart(2, "0")}
          </Text>
        </View>
      </View>

      {/* Duration Selector */}
      <View style={styles.durationSelector}>
        {[30, 60, 120].map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.durationButton,
              duration === d && styles.durationButtonActive,
            ]}
            onPress={() => {
              setDuration(d);
              setTimeRemaining(d);
            }}
            disabled={isActive}
          >
            <Text style={styles.durationText}>{d}s</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.actionButton, isActive && styles.actionButtonActive]}
        onPress={isActive ? handleStopSession : handleStartSession}
      >
        <Text
          style={[
            styles.actionButtonText,
            isActive && styles.actionButtonTextActive,
          ]}
        >
          {isActive ? "Stop Session" : "Start Session"}
        </Text>
      </TouchableOpacity>

      {/* Pattern Info */}
      <View style={styles.patternInfo}>
        <Text style={styles.patternLabel}>Pattern: {selectedPattern}</Text>
        <TouchableOpacity
          onPress={() => {
            // Cycle through patterns
            const patterns = ["standard", "gentle-wave", "soft-pulse"];
            const currentIndex = patterns.indexOf(selectedPattern);
            const nextIndex = (currentIndex + 1) % patterns.length;
            setSelectedPattern(patterns[nextIndex]);
          }}
          disabled={isActive}
        >
          <Text style={styles.changePattern}>Change ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Streak Display */}
      <View style={styles.streakBanner}>
        <Text style={styles.streakText}>Streak: {streak} sessions 🔥</Text>
      </View>

      {/* Disclaimer Footer */}
      <Text style={styles.disclaimerFooter}>{DISCLAIMERS.IOS_SHORT}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 60,
  },
  logo: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: "bold",
  },
  settingsIcon: {
    fontSize: 28,
  },
  tagline: {
    color: COLORS.WHITE,
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    opacity: 0.9,
    fontStyle: "italic",
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,
    borderColor: COLORS.WHITE,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    color: COLORS.WHITE,
    fontSize: 72,
    fontWeight: "300",
    fontFamily: "Courier",
  },
  durationSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 30,
  },
  durationButton: {
    width: 90,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  durationButtonActive: {
    borderColor: COLORS.WARM_GOLD,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  durationText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  actionButtonActive: {
    backgroundColor: COLORS.ALERT_RED,
  },
  actionButtonText: {
    color: COLORS.MEDICAL_BLUE,
    fontSize: 20,
    fontWeight: "bold",
  },
  actionButtonTextActive: {
    color: COLORS.WHITE,
  },
  patternInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
  },
  patternLabel: {
    color: COLORS.WHITE,
    fontSize: 16,
  },
  changePattern: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  streakBanner: {
    marginTop: 20,
    alignItems: "center",
  },
  streakText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "600",
  },
  disclaimerFooter: {
    color: COLORS.WHITE,
    fontSize: 10,
    textAlign: "center",
    marginTop: "auto",
    opacity: 0.7,
    paddingHorizontal: 20,
  },
});
