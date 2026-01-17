// client/screens/SettingsScreen.tsx - COMPLETE FILE
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";

import { SensoryService, UserPreferences } from "../services/SensoryService";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const sensoryService = new SensoryService();

  const [preferences, setPreferences] = useState<UserPreferences>({
    vibrationIntensity: 0.7,
    audioEnabled: true,
    visualEffectsEnabled: true,
    defaultDuration: 24,
    preferredSite: "thigh",
  });

  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    averageDuration: 0,
    favoritesite: "thigh",
    completionRate: 0,
  });

  useEffect(() => {
    loadPreferences();
    loadSessionStats();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await sensoryService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const loadSessionStats = async () => {
    try {
      const stats = await sensoryService.getSessionStats();
      setSessionStats(stats);
    } catch (error) {
      console.error("Error loading session stats:", error);
    }
  };

  const savePreferences = async (newPrefs: Partial<UserPreferences>) => {
    try {
      const updated = { ...preferences, ...newPrefs };
      await sensoryService.savePreferences(updated);
      setPreferences(updated);
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", "Failed to save preferences");
    }
  };

  const testVibration = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error("Error testing vibration:", error);
    }
  };

  const clearSessionHistory = () => {
    Alert.alert(
      "Clear Session History",
      "Are you sure you want to delete all session history? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setSessionStats({
              totalSessions: 0,
              averageDuration: 0,
              favoritesite: "thigh",
              completionRate: 0,
            });
            Alert.alert("Success", "Session history cleared");
          },
        },
      ],
    );
  };

  const resetToDefaults = () => {
    Alert.alert("Reset Settings", "Reset all settings to default values?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Reset",
        onPress: () => {
          const defaults: UserPreferences = {
            vibrationIntensity: 0.7,
            audioEnabled: true,
            visualEffectsEnabled: true,
            defaultDuration: 24,
            preferredSite: "thigh",
          };
          savePreferences(defaults);
        },
      },
    ]);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#2C3E50" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Feather name="refresh-cw" size={20} color="#7F8C8D" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sessionStats.totalSessions > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {sessionStats.totalSessions}
                </Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {sessionStats.averageDuration}s
                </Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {sessionStats.completionRate}%
                </Text>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {getSiteEmoji(sessionStats.favoritesite)}
                </Text>
                <Text style={styles.statLabel}>Favorite Site</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Haptic Feedback</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Vibration Intensity</Text>
              <TouchableOpacity
                style={styles.testButton}
                onPress={testVibration}
              >
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={preferences.vibrationIntensity}
              onValueChange={(value) => {
                setPreferences((prev) => ({
                  ...prev,
                  vibrationIntensity: value,
                }));
              }}
              onSlidingComplete={(value) => {
                savePreferences({ vibrationIntensity: value });
                testVibration();
              }}
              minimumTrackTintColor="#3498DB"
              maximumTrackTintColor="#ECF0F1"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Gentle</Text>
              <Text style={styles.sliderLabel}>Strong</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Visual</Text>

          <View style={styles.settingItem}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.settingLabel}>Audio Feedback</Text>
                <Text style={styles.settingDescription}>
                  Play sounds during sessions
                </Text>
              </View>
              <Switch
                value={preferences.audioEnabled}
                onValueChange={(value) => {
                  setPreferences((prev) => ({ ...prev, audioEnabled: value }));
                  savePreferences({ audioEnabled: value });
                }}
                trackColor={{ false: "#ECF0F1", true: "#3498DB" }}
                thumbColor={preferences.audioEnabled ? "#FFFFFF" : "#BDC3C7"}
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.settingLabel}>Visual Effects</Text>
                <Text style={styles.settingDescription}>
                  Animated backgrounds and dragonfly
                </Text>
              </View>
              <Switch
                value={preferences.visualEffectsEnabled}
                onValueChange={(value) => {
                  setPreferences((prev) => ({
                    ...prev,
                    visualEffectsEnabled: value,
                  }));
                  savePreferences({ visualEffectsEnabled: value });
                }}
                trackColor={{ false: "#ECF0F1", true: "#3498DB" }}
                thumbColor={
                  preferences.visualEffectsEnabled ? "#FFFFFF" : "#BDC3C7"
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Session Settings</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Default Duration</Text>
            <View style={styles.durationButtons}>
              {[18, 24, 30].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationButton,
                    preferences.defaultDuration === duration &&
                      styles.selectedDurationButton,
                  ]}
                  onPress={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      defaultDuration: duration,
                    }));
                    savePreferences({ defaultDuration: duration });
                  }}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      preferences.defaultDuration === duration &&
                        styles.selectedDurationButtonText,
                    ]}
                  >
                    {duration}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Preferred Site</Text>
            <View style={styles.siteButtons}>
              {[
                { id: "finger", name: "Finger", emoji: "👆" },
                { id: "upper-arm", name: "Upper Arm", emoji: "💪" },
                { id: "thigh", name: "Thigh", emoji: "🦵" },
                { id: "abdomen", name: "Abdomen", emoji: "🤰" },
              ].map((site) => (
                <TouchableOpacity
                  key={site.id}
                  style={[
                    styles.siteButton,
                    preferences.preferredSite === site.id &&
                      styles.selectedSiteButton,
                  ]}
                  onPress={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      preferredSite: site.id,
                    }));
                    savePreferences({ preferredSite: site.id });
                  }}
                >
                  <Text style={styles.siteButtonEmoji}>{site.emoji}</Text>
                  <Text
                    style={[
                      styles.siteButtonText,
                      preferences.preferredSite === site.id &&
                        styles.selectedSiteButtonText,
                    ]}
                  >
                    {site.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={clearSessionHistory}
          >
            <Feather name="trash-2" size={20} color="#E74C3C" />
            <Text style={styles.actionButtonText}>Clear Session History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutCard}>
            <Text style={styles.appName}>Alivio's Easel</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              Comfort-focused sensory distraction for medical procedures. Using
              haptic feedback, visual animations, and audio cues to help reduce
              anxiety and pain during injections.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ECF0F1",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    textAlign: "center",
  },
  resetButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECF0F1",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3498DB",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
  },
  settingItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECF0F1",
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
  },
  settingDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 2,
  },
  testButton: {
    backgroundColor: "#3498DB",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#3498DB",
    width: 24,
    height: 24,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchInfo: {
    flex: 1,
  },
  durationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  durationButton: {
    flex: 1,
    backgroundColor: "#ECF0F1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedDurationButton: {
    backgroundColor: "#3498DB",
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7F8C8D",
  },
  selectedDurationButtonText: {
    color: "white",
  },
  siteButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
  },
  siteButton: {
    width: "48%",
    backgroundColor: "#ECF0F1",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  selectedSiteButton: {
    backgroundColor: "#3498DB",
  },
  siteButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  siteButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7F8C8D",
  },
  selectedSiteButtonText: {
    color: "white",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECF0F1",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#E74C3C",
    marginLeft: 12,
    fontWeight: "500",
  },
  aboutCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECF0F1",
    alignItems: "center",
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: "#34495E",
    textAlign: "center",
    lineHeight: 20,
  },
});
