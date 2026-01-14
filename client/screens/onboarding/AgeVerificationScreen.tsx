import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { BackButton } from "@/components/BackButton";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function AgeVerificationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { onboarding, updateOnboarding } = useApp();
  const [age, setAge] = useState("");

  const ageNumber = parseInt(age, 10);
  const isValidAge = !isNaN(ageNumber) && ageNumber > 0 && ageNumber <= 130;

  const handleContinue = async () => {
    if (!isValidAge) return;

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await updateOnboarding({ age: ageNumber });

    if (ageNumber < 18) {
      navigation.navigate("ParentalConsent");
    } else {
      navigation.navigate("Preferences");
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 8,
          zIndex: 10,
        }}
      >
        <BackButton />
      </View>
      <View
        style={[styles.content, { paddingTop: insets.top + Spacing["3xl"] }]}
      >
        <ThemedText style={styles.title}>What's your age?</ThemedText>
        <ThemedText style={styles.subtitle}>
          This helps us personalize your experience
        </ThemedText>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="Enter age"
            placeholderTextColor={Colors.light.textSecondary}
            testID="input-age"
          />
        </View>
        {ageNumber > 0 && ageNumber < 18 ? (
          <View style={styles.notice}>
            <ThemedText style={styles.noticeText}>
              A parent or guardian will need to provide consent
            </ThemedText>
          </View>
        ) : null}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !isValidAge && styles.buttonDisabled,
            pressed && isValidAge && styles.buttonPressed,
          ]}
          onPress={handleContinue}
          disabled={!isValidAge}
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
  content: {
    flex: 1,
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  inputContainer: {
    width: "100%",
    maxWidth: 200,
  },
  input: {
    ...Typography.headline,
    fontSize: 48,
    color: Colors.light.text,
    textAlign: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  notice: {
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.accent,
  },
  noticeText: {
    ...Typography.body,
    color: Colors.light.text,
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    backgroundColor: Colors.light.accent,
    borderRadius: BorderRadius.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...Typography.body,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
