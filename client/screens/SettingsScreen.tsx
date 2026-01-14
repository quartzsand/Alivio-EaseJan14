import React, { useState } from "react";
import { View, StyleSheet, Pressable, Switch, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { PeakStyle } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { preferences, updatePreferences, clearSessions, resetApp } = useApp();
  const [hapticIntensity, setHapticIntensity] = useState(preferences.hapticIntensity);
  const [audioVolume, setAudioVolume] = useState(preferences.audioVolume ?? 0.7);
  const [snapDensity, setSnapDensity] = useState(preferences.snapDensity ?? 0.5);

  const handleHapticSliderChange = async (value: number) => {
    setHapticIntensity(value);
  };

  const handleHapticSliderComplete = async (value: number) => {
    await updatePreferences({ hapticIntensity: value });
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAudioVolumeChange = async (value: number) => {
    setAudioVolume(value);
  };

  const handleAudioVolumeComplete = async (value: number) => {
    await updatePreferences({ audioVolume: value });
  };

  const handleSnapDensityChange = async (value: number) => {
    setSnapDensity(value);
  };

  const handleSnapDensityComplete = async (value: number) => {
    await updatePreferences({ snapDensity: value });
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAudioToggle = async (value: boolean) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updatePreferences({ audioEnabled: value });
  };

  const handleDebugToggle = async (value: boolean) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updatePreferences({ debugMode: value });
  };

  const handlePeakStyleChange = async (style: PeakStyle) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updatePreferences({ peakStyle: style });
  };

  const handleOpenDiscovery = () => {
    navigation.navigate("DiscoveryWizard", {});
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all session history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearSessions();
            if (Platform.OS !== "web") {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      "Reset App",
      "This will clear all data and restart the onboarding. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Reset",
              "This action cannot be undone. All your data will be lost.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Reset Everything",
                  style: "destructive",
                  onPress: async () => {
                    await resetApp();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + Spacing["3xl"],
          paddingBottom: tabBarHeight + Spacing["2xl"],
        },
      ]}
    >
      <ThemedText style={styles.title}>Settings</ThemedText>

      <ThemedText style={styles.sectionTitle}>Haptic Preferences</ThemedText>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <ThemedText style={styles.settingLabel}>Haptic Intensity</ThemedText>
        </View>
        <View style={styles.sliderContainer}>
          <ThemedText style={styles.sliderLabel}>Gentle</ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            value={hapticIntensity}
            onValueChange={handleHapticSliderChange}
            onSlidingComplete={handleHapticSliderComplete}
            minimumTrackTintColor={Colors.light.primary}
            maximumTrackTintColor={Colors.light.border}
            thumbTintColor={Colors.light.primary}
            testID="slider-haptic"
          />
          <ThemedText style={styles.sliderLabel}>Strong</ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText style={styles.settingLabel}>Peak Style</ThemedText>
            <ThemedText style={styles.settingDescription}>
              How haptics behave during peak phase
            </ThemedText>
          </View>
        </View>
        <View style={styles.segmented}>
          <Pressable
            style={({ pressed }) => [
              styles.segButton,
              preferences.peakStyle === "max" && styles.segButtonSelected,
              pressed && styles.segButtonPressed,
            ]}
            onPress={() => handlePeakStyleChange("max")}
            testID="button-peak-max"
          >
            <ThemedText style={[styles.segButtonText, preferences.peakStyle === "max" && styles.segButtonTextSelected]}>Max</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.segButton,
              preferences.peakStyle === "snap" && styles.segButtonSelected,
              pressed && styles.segButtonPressed,
            ]}
            onPress={() => handlePeakStyleChange("snap")}
            testID="button-peak-snap"
          >
            <ThemedText style={[styles.segButtonText, preferences.peakStyle === "snap" && styles.segButtonTextSelected]}>Snap</ThemedText>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <ThemedText style={styles.settingLabel}>Snap Density</ThemedText>
        </View>
        <View style={styles.sliderContainer}>
          <ThemedText style={styles.sliderLabel}>Sparse</ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            value={snapDensity}
            onValueChange={handleSnapDensityChange}
            onSlidingComplete={handleSnapDensityComplete}
            minimumTrackTintColor={Colors.light.accent}
            maximumTrackTintColor={Colors.light.border}
            thumbTintColor={Colors.light.accent}
            testID="slider-snap-density"
          />
          <ThemedText style={styles.sliderLabel}>Dense</ThemedText>
        </View>
      </Card>

      <ThemedText style={styles.sectionTitle}>Audio Preferences</ThemedText>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText style={styles.settingLabel}>Sound Effects</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Play calming sounds during sessions
            </ThemedText>
          </View>
          <Switch
            value={preferences.audioEnabled}
            onValueChange={handleAudioToggle}
            trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
            thumbColor={Colors.light.surface}
            testID="switch-audio"
          />
        </View>

        {preferences.audioEnabled && (
          <>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>Audio Volume</ThemedText>
            </View>
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderLabel}>Low</ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={1}
                value={audioVolume}
                onValueChange={handleAudioVolumeChange}
                onSlidingComplete={handleAudioVolumeComplete}
                minimumTrackTintColor={Colors.light.primary}
                maximumTrackTintColor={Colors.light.border}
                thumbTintColor={Colors.light.primary}
                testID="slider-audio-volume"
              />
              <ThemedText style={styles.sliderLabel}>High</ThemedText>
            </View>
          </>
        )}
      </Card>

      <ThemedText style={styles.sectionTitle}>Visual Preferences</ThemedText>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <ThemedText style={styles.settingLabel}>Dragonfly</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Choose your dragonfly style for sessions
            </ThemedText>
          </View>
          <View style={styles.segmented}>
            <Pressable
              style={({ pressed }) => [
                styles.segButton,
                preferences.dragonflyVariant === "blue" && styles.segButtonSelected,
                pressed && styles.segButtonPressed,
              ]}
              onPress={() => updatePreferences({ dragonflyVariant: "blue" })}
              testID="button-dragonfly-blue"
            >
              <ThemedText style={[styles.segButtonText, preferences.dragonflyVariant === "blue" && styles.segButtonTextSelected]}>Blue</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.segButton,
                preferences.dragonflyVariant === "white" && styles.segButtonSelected,
                pressed && styles.segButtonPressed,
              ]}
              onPress={() => updatePreferences({ dragonflyVariant: "white" })}
              testID="button-dragonfly-white"
            >
              <ThemedText style={[styles.segButtonText, preferences.dragonflyVariant === "white" && styles.segButtonTextSelected]}>White</ThemedText>
            </Pressable>
          </View>
        </View>
      </Card>

      <ThemedText style={styles.sectionTitle}>Tuning</ThemedText>
      <Card style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={handleOpenDiscovery}
          testID="button-discovery-wizard"
        >
          <Feather name="sliders" size={20} color={Colors.light.primary} />
          <ThemedText style={styles.menuItemText}>Discovery Wizard</ThemedText>
          <Feather name="chevron-right" size={20} color={Colors.light.textSecondary} />
        </Pressable>
        <ThemedText style={styles.menuItemDescription}>
          Fine-tune settings for each site
        </ThemedText>
      </Card>

      <ThemedText style={styles.sectionTitle}>Developer</ThemedText>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText style={styles.settingLabel}>Debug Mode</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Show technical information during sessions
            </ThemedText>
          </View>
          <Switch
            value={preferences.debugMode}
            onValueChange={handleDebugToggle}
            trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
            thumbColor={Colors.light.surface}
            testID="switch-debug"
          />
        </View>
      </Card>

      <ThemedText style={styles.sectionTitle}>Information</ThemedText>
      <Card style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={() => navigation.navigate("About")}
          testID="button-about"
        >
          <Feather name="info" size={20} color={Colors.light.textSecondary} />
          <ThemedText style={styles.menuItemText}>About Alivio Ease</ThemedText>
          <Feather name="chevron-right" size={20} color={Colors.light.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={() => navigation.navigate("DisclaimerModal")}
          testID="button-disclaimer"
        >
          <Feather name="file-text" size={20} color={Colors.light.textSecondary} />
          <ThemedText style={styles.menuItemText}>View Disclaimer</ThemedText>
          <Feather name="chevron-right" size={20} color={Colors.light.textSecondary} />
        </Pressable>
      </Card>

      <ThemedText style={styles.sectionTitle}>Account</ThemedText>
      <Card style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={handleClearHistory}
          testID="button-clear-history"
        >
          <Feather name="trash-2" size={20} color={Colors.light.warning} />
          <ThemedText style={[styles.menuItemText, styles.warningText]}>
            Clear History
          </ThemedText>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          onPress={handleResetApp}
          testID="button-reset-app"
        >
          <Feather name="refresh-cw" size={20} color="#E74C3C" />
          <ThemedText style={[styles.menuItemText, styles.dangerText]}>
            Reset App
          </ThemedText>
        </Pressable>
      </Card>

      <ThemedText style={styles.version}>Alivio Ease v0.15</ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  title: {
    ...Typography.headline,
    color: Colors.light.text,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.button,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.light.text,
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    width: 50,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.lg,
    opacity: 0.6,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  segButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: "transparent",
  },
  segButtonSelected: {
    backgroundColor: Colors.light.primary,
  },
  segButtonPressed: {
    opacity: 0.85,
  },
  segButtonText: {
    ...Typography.caption,
    color: Colors.light.text,
  },
  segButtonTextSelected: {
    color: Colors.light.buttonText,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemText: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuItemDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  warningText: {
    color: "#E67E22",
  },
  dangerText: {
    color: "#E74C3C",
  },
  version: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
