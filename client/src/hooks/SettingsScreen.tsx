// src/components/SettingsScreen.tsx (Enhanced)
import React, { useState, useEffect } from "react";
import { View, Text, Switch, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AdvancedSettings {
  showTestProfiles: boolean;
  enableAudioAnalysis: boolean;
  enableVisualBreathing: boolean;
  gradientIntensity: number;
  sizeVariation: number;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AdvancedSettings>({
    showTestProfiles: false,
    enableAudioAnalysis: false,
    enableVisualBreathing: true,
    gradientIntensity: 60,
    sizeVariation: 70,
  });

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        "alivio_advanced_settings",
      );
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (newSettings: AdvancedSettings) => {
    try {
      await AsyncStorage.setItem(
        "alivio_advanced_settings",
        JSON.stringify(newSettings),
      );
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const toggleTestProfiles = (value: boolean) => {
    if (value) {
      // Show info alert when enabling test profiles
      Alert.alert(
        "Test Profiles Enabled",
        "Two validation profiles are now available:\n\n• Test A: Sharp Pain Relief (Gate Control Theory)\n• Test B: Deep Comfort (Massage Simulation)\n\nThese profiles are designed for technical validation and may feel different from the main wellness profiles.",
        [{ text: "Got it", style: "default" }],
      );
    }

    saveSettings({ ...settings, showTestProfiles: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alivio Ease Settings</Text>

      {/* Visual Breathing Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visual Experience</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Visual Breathing Timer</Text>
          <Switch
            value={settings.enableVisualBreathing}
            onValueChange={(value) =>
              saveSettings({ ...settings, enableVisualBreathing: value })
            }
            trackColor={{ false: "#ecf0f1", true: "#3498db" }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Developer/Advanced Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced Options</Text>
        <Text style={styles.sectionDescription}>
          Advanced features for power users and validation
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Test Profiles</Text>
            <Text style={styles.settingSubtext}>
              Show validation profiles for technical testing
            </Text>
          </View>
          <Switch
            value={settings.showTestProfiles}
            onValueChange={toggleTestProfiles}
            trackColor={{ false: "#ecf0f1", true: "#e67e22" }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Audio Analysis</Text>
            <Text style={styles.settingSubtext}>
              Real-time frequency analysis (experimental)
            </Text>
          </View>
          <Switch
            value={settings.enableAudioAnalysis}
            onValueChange={(value) =>
              saveSettings({ ...settings, enableAudioAnalysis: value })
            }
            trackColor={{ false: "#ecf0f1", true: "#9b59b6" }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* About/Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Alivio Ease v1.0{"\n"}
          Sensory wellness profiles for personal comfort
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 16,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 12,
    color: "#7f8c8d",
    lineHeight: 16,
  },
  aboutText: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 18,
    textAlign: "center",
  },
});
