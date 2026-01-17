// client/screens/HomeScreen.tsx - COMPLETE FILE WITH ALL FEATURES
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { SensoryService } from "../services/SensoryService";

const INJECTION_SITES = [
  {
    id: "finger",
    name: "Finger",
    emoji: "👆",
    description: "Quick blood glucose testing",
  },
  {
    id: "upper-arm",
    name: "Upper Arm",
    emoji: "💪",
    description: "Vaccines and medications",
  },
  {
    id: "thigh",
    name: "Thigh",
    emoji: "🦵",
    description: "Large muscle injections",
  },
  {
    id: "abdomen",
    name: "Abdomen",
    emoji: "🤰",
    description: "Subcutaneous medications",
  },
];

const DURATIONS = [18, 24, 30];

export default function HomeScreen() {
  const navigation = useNavigation();
  const [selectedSite, setSelectedSite] = useState("thigh");
  const [selectedDuration, setSelectedDuration] = useState(24);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    averageDuration: 0,
    favoritesite: "thigh",
    completionRate: 0,
  });

  const sensoryService = new SensoryService();

  useEffect(() => {
    loadSessionStats();
  }, []);

  const loadSessionStats = async () => {
    try {
      const stats = await sensoryService.getSessionStats();
      setSessionStats(stats);

      // Set favorite site as default if available
      if (stats.favoritesite && stats.totalSessions > 0) {
        setSelectedSite(stats.favoritesite);
      }
    } catch (error) {
      console.error("Error loading session stats:", error);
    }
  };

  const startSession = () => {
    navigation.navigate("Session", {
      preferences: {
        defaultDuration: selectedDuration,
        preferredSite: selectedSite,
        vibrationIntensity: 0.7,
        audioEnabled: true,
        visualEffectsEnabled: true,
      },
    });
  };

  const getSiteInfo = (siteId: string) => {
    return INJECTION_SITES.find((site) => site.id === siteId);
  };

  const showSessionHistory = async () => {
    try {
      const history = await sensoryService.getSessionHistory();

      if (history.length === 0) {
        Alert.alert(
          "No Session History",
          "You haven't completed any sessions yet. Start your first session to see your progress!",
        );
        return;
      }

      const recentSessions = history.slice(0, 5);
      const historyText = recentSessions
        .map((session, index) => {
          const date = new Date(session.startTime).toLocaleDateString();
          const site =
            session.site.charAt(0).toUpperCase() + session.site.slice(1);
          return `${index + 1}. ${date} - ${site} (${session.duration}s)`;
        })
        .join("\n");

      Alert.alert(
        "Recent Sessions",
        `Your last ${recentSessions.length} sessions:\n\n${historyText}`,
        [
          {
            text: "Close",
            style: "cancel",
          },
        ],
      );
    } catch (error) {
      console.error("Error showing session history:", error);
      Alert.alert("Error", "Unable to load session history");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Alivio's Easel</Text>
        <Text style={styles.appSubtitle}>
          Comfort for your wellness journey
        </Text>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Feather name="settings" size={20} color="#7F8C8D" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Stats */}
        {sessionStats.totalSessions > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {sessionStats.totalSessions}
                </Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {sessionStats.averageDuration}s
                </Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {sessionStats.completionRate}%
                </Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.historyButton}
              onPress={showSessionHistory}
            >
              <Feather name="clock" size={16} color="#3498DB" />
              <Text style={styles.historyButtonText}>View History</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Site Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Select Injection Site</Text>
          {sessionStats.totalSessions > 0 &&
            sessionStats.favoritesite === selectedSite && (
              <Text style={styles.favoriteLabel}>⭐ Your most used site</Text>
            )}

          <View style={styles.siteGrid}>
            {INJECTION_SITES.map((site) => {
              const isSelected = selectedSite === site.id;

              return (
                <TouchableOpacity
                  key={site.id}
                  style={[
                    styles.siteCard,
                    isSelected && styles.selectedSiteCard,
                  ]}
                  onPress={() => setSelectedSite(site.id)}
                >
                  <Text style={styles.siteEmoji}>{site.emoji}</Text>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <Text style={styles.siteDescription}>{site.description}</Text>

                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Feather name="check-circle" size={16} color="#2ECC71" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Session Duration</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how long you want the comfort session to last
          </Text>

          <View style={styles.durationRow}>
            {DURATIONS.map((duration) => {
              const isSelected = selectedDuration === duration;

              return (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationCard,
                    isSelected && styles.selectedDurationCard,
                  ]}
                  onPress={() => setSelectedDuration(duration)}
                >
                  <Text
                    style={[
                      styles.durationNumber,
                      isSelected && styles.selectedDurationNumber,
                    ]}
                  >
                    {duration}
                  </Text>
                  <Text
                    style={[
                      styles.durationLabel,
                      isSelected && styles.selectedDurationLabel,
                    ]}
                  >
                    seconds
                  </Text>

                  {isSelected && (
                    <View style={styles.durationSelectedIndicator}>
                      <Feather name="check" size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Duration explanation */}
          <View style={styles.durationExplanation}>
            <Text style={styles.explanationText}>
              {selectedDuration === 18 &&
                "⚡ Quick session - Perfect for blood glucose testing"}
              {selectedDuration === 24 &&
                "⭐ Balanced session - Great for most injections"}
              {selectedDuration === 30 &&
                "🧘 Extended session - Maximum comfort for sensitive injections"}
            </Text>
          </View>
        </View>

        {/* Session Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Session Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Site:</Text>
              <View style={styles.previewValue}>
                <Text style={styles.previewEmoji}>
                  {getSiteInfo(selectedSite)?.emoji}
                </Text>
                <Text style={styles.previewText}>
                  {getSiteInfo(selectedSite)?.name}
                </Text>
              </View>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Duration:</Text>
              <Text style={styles.previewText}>{selectedDuration} seconds</Text>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Phases:</Text>
              <Text style={styles.previewText}>
                {selectedDuration === 18 && "3s prep • 12s active • 3s cool"}
                {selectedDuration === 24 && "4s prep • 16s active • 4s cool"}
                {selectedDuration === 30 && "5s prep • 20s active • 5s cool"}
              </Text>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Features:</Text>
              <Text style={styles.previewText}>
                🦋 Dragonfly • 📳 Haptics • 🎵 Audio
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.startButton} onPress={startSession}>
          <Feather name="play" size={24} color="white" />
          <Text style={styles.startButtonText}>
            Start {selectedDuration}s Session
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: "relative",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  settingsButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsSection: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ECF0F1",
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3498DB",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: "#3498DB",
    marginLeft: 6,
    fontWeight: "500",
  },
  selectionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 16,
  },
  favoriteLabel: {
    fontSize: 12,
    color: "#F39C12",
    marginBottom: 8,
    fontWeight: "500",
  },
  siteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  siteCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ECF0F1",
    position: "relative",
  },
  selectedSiteCard: {
    borderColor: "#3498DB",
    backgroundColor: "#EBF3FD",
  },
  siteEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  siteName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  siteDescription: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 16,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  durationCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ECF0F1",
    position: "relative",
  },
  selectedDurationCard: {
    borderColor: "#2ECC71",
    backgroundColor: "#2ECC71",
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  selectedDurationNumber: {
    color: "white",
  },
  durationLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  selectedDurationLabel: {
    color: "white",
  },
  durationSelectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  durationExplanation: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  explanationText: {
    fontSize: 14,
    color: "#34495E",
    textAlign: "center",
    fontStyle: "italic",
  },
  previewSection: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECF0F1",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  previewValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  previewText: {
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "500",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498DB",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#3498DB",
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
});
