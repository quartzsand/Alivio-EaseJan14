import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { DISCLAIMERS } from "@/constants/disclaimers";

export default function DisclaimerModalScreen() {
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
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Wellness Disclaimer</ThemedText>
        <View style={styles.disclaimerBox}>
          <ThemedText style={styles.disclaimerText}>{DISCLAIMERS.MASTER}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Device Placement</ThemedText>
        <View style={styles.infoBox}>
          <ThemedText style={styles.infoText}>{DISCLAIMERS.PLACEMENT_GUIDE}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Vibration Settings</ThemedText>
        <View style={styles.infoBox}>
          <ThemedText style={styles.infoText}>{DISCLAIMERS.VIBRATION_PARAMS}</ThemedText>
        </View>
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  disclaimerBox: {
    backgroundColor: Colors.light.warning + "30",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.warning,
  },
  disclaimerText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  infoBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
});
