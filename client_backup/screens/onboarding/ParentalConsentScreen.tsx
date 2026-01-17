import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { DISCLAIMERS } from "@/constants/disclaimers";
import { useApp } from "@/context/AppContext";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, "ParentalConsent">;

export default function ParentalConsentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { updateOnboarding } = useApp();
  const [consent, setConsent] = useState(false);

  const handleToggle = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setConsent(!consent);
  };

  const handleContinue = async () => {
    if (!consent) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await updateOnboarding({ parentalConsentGiven: true });
    navigation.navigate("Preferences");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing["2xl"] }]}>
      <View style={styles.header}>
        <Feather name="shield" size={48} color={Colors.light.primary} />
        <ThemedText style={styles.title}>Parental Permission Required</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <ThemedText style={styles.instruction}>
          Please have a parent or guardian read the following and provide consent:
        </ThemedText>

        <View style={styles.consentBox}>
          <ThemedText style={styles.consentText}>
            {DISCLAIMERS.PARENTAL_CONSENT}
          </ThemedText>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}>
        <Pressable
          style={styles.checkboxRow}
          onPress={handleToggle}
          testID="checkbox-consent"
        >
          <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
            {consent ? (
              <Feather name="check" size={16} color={Colors.light.buttonText} />
            ) : null}
          </View>
          <ThemedText style={styles.checkboxLabel}>
            I am a parent/guardian and I consent to my child using this wellness app
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !consent && styles.buttonDisabled,
            pressed && consent && styles.buttonPressed,
          ]}
          onPress={handleContinue}
          disabled={!consent}
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
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    color: Colors.light.text,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing.lg,
  },
  instruction: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  consentBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  consentText: {
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
