import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { updateOnboarding, updatePreferences } = useApp();
  const [name, setName] = useState("");
  const [hapticIntensity, setHapticIntensity] = useState(0.5);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const handleComplete = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updatePreferences({
      displayName: name || "Friend",
      hapticIntensity,
      audioEnabled,
    });
    await updateOnboarding({ completed: true });
  };

  const handleSliderChange = async (value: number) => {
    setHapticIntensity(value);
    if (Platform.OS !== "web" && Math.abs(value - hapticIntensity) > 0.1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing["3xl"] }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Personalize Your Experience</ThemedText>
        <ThemedText style={styles.subtitle}>
          You can always change these later in settings
        </ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>What should we call you?</ThemedText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.light.textSecondary}
            testID="input-name"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Haptic Intensity</ThemedText>
          <View style={styles.sliderContainer}>
            <ThemedText style={styles.sliderLabel}>Gentle</ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1}
              value={hapticIntensity}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={Colors.light.primary}
              maximumTrackTintColor={Colors.light.border}
              thumbTintColor={Colors.light.primary}
              testID="slider-haptic"
            />
            <ThemedText style={styles.sliderLabel}>Strong</ThemedText>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>Sound Effects</ThemedText>
            <Switch
              value={audioEnabled}
              onValueChange={setAudioEnabled}
              trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
              thumbColor={Colors.light.surface}
              testID="switch-audio"
            />
          </View>
          <ThemedText style={styles.switchDescription}>
            Play calming sounds during sessions
          </ThemedText>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleComplete}
          testID="button-complete"
        >
          <ThemedText style={styles.buttonText}>Start Using Alivio Ease</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  title: {
    ...Typography.headline,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: Spacing["3xl"],
  },
  formGroup: {
    marginBottom: Spacing["2xl"],
  },
  label: {
    ...Typography.button,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.body,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing["2xl"],
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
  },
});
