import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import onboardingHero from "../../../assets/images/onboarding-hero.png";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, "Welcome">;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient
      colors={[Colors.light.background, Colors.light.accent + "30"]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + Spacing["3xl"] }]}>
        <View style={styles.heroContainer}>
          <Image
            source={onboardingHero}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>Alivio Ease</ThemedText>
          <ThemedText style={styles.subtitle}>
            Your companion for calm moments
          </ThemedText>
          <ThemedText style={styles.description}>
            Gentle sensory distraction to support your comfort during routine self-care
          </ThemedText>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("Disclaimer")}
          testID="button-continue"
        >
          <ThemedText style={styles.buttonText}>Get Started</ThemedText>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  heroContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    maxHeight: 320,
  },
  heroImage: {
    width: 280,
    height: 280,
  },
  textContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  title: {
    ...Typography.headline,
    fontSize: 36,
    color: Colors.light.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.title,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  description: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 300,
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
