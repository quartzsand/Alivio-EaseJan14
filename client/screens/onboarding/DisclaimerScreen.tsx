import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { DISCLAIMERS } from "@/constants/disclaimers";
import { useApp } from "@/context/AppContext";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, "Disclaimer">;

export default function DisclaimerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { updateOnboarding } = useApp();
  const [accepted, setAccepted] = useState(false);

  const handleToggle = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAccepted(!accepted);
  };

  const handleContinue = async () => {
    if (!accepted) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await updateOnboarding({ disclaimerAccepted: true });
    navigation.navigate("AgeVerification");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing["2xl"] }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Important Information</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.disclaimerBox}>
          <ThemedText style={styles.disclaimerText}>
            {DISCLAIMERS.MASTER}
          </ThemedText>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}>
        <Pressable
          style={styles.checkboxRow}
          onPress={handleToggle}
          testID="checkbox-disclaimer"
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted ? (
              <Feather name="check" size={16} color={Colors.light.buttonText} />
            ) : null}
          </View>
          <ThemedText style={styles.checkboxLabel}>
            I understand this is a wellness tool, not medical advice
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !accepted && styles.buttonDisabled,
            pressed && accepted && styles.buttonPressed,
          ]}
          onPress={handleContinue}
          disabled={!accepted}
          testID="button-continue"
        >
          <ThemedText style={styles.buttonText}>Continue</ThemedText>
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
  header: {
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing.lg,
    alignItems: "center",
  },
  title: {
    ...Typography.headline,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing.lg,
  },
  disclaimerBox: {
    backgroundColor: Colors.light.warning + "30",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.warning,
  },
  disclaimerText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  footer: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
  },
  checkboxLabel: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: Colors.light.border,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
  },
});
