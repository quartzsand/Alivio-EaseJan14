import React from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

import appIcon from "../../assets/images/icon.png";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
    >
      <View style={styles.logoSection}>
        <Image source={appIcon} style={styles.logo} resizeMode="contain" />
        <ThemedText style={styles.appName}>Alivio Ease</ThemedText>
        <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <ThemedText style={styles.paragraph}>
          Alivio Ease is a wellness companion designed to support relaxation and 
          comfort during routine self-care moments through gentle sensory distraction.
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          Using a combination of haptic vibration patterns, calming audio, and 
          visual focus techniques featuring Ali the dragonfly, Alivio Ease helps 
          create a sense of calm during your personal care routines.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Meet Ali</ThemedText>
        <ThemedText style={styles.paragraph}>
          Ali is your friendly dragonfly companion who appears during sessions 
          to provide a gentle focal point for visual distraction. Watch Ali's 
          peaceful movements to help center your attention and promote calmness.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>How It Works</ThemedText>
        <View style={styles.featureList}>
          <View style={styles.feature}>
            <ThemedText style={styles.featureTitle}>Haptic Patterns</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Choose from three gentle vibration patterns designed to provide 
              sensory distraction during your sessions.
            </ThemedText>
          </View>
          <View style={styles.feature}>
            <ThemedText style={styles.featureTitle}>Audio Feedback</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Calming sounds signal the start and completion of your sessions, 
              helping you stay present and relaxed.
            </ThemedText>
          </View>
          <View style={styles.feature}>
            <ThemedText style={styles.featureTitle}>Session Tracking</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Track your comfort levels over time to understand what works 
              best for you.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Alivio Ease is a wellness tool, not a medical device.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.headline,
    color: Colors.light.primary,
  },
  version: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  featureList: {
    gap: Spacing.lg,
  },
  feature: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  featureTitle: {
    ...Typography.button,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});
