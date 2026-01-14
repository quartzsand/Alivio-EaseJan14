import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ScrollView, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { WELLNESS_TIPS } from "@/constants/disclaimers";
import { useApp } from "@/context/AppContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { preferences, sessionsThisWeek } = useApp();
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * WELLNESS_TIPS.length));
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const displayName = preferences.displayName || "Friend";
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  const handleStartSession = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate("Session");
  };

  const dismissTip = () => {
    setShowTip(false);
  };

  return (
    <LinearGradient
      colors={[Colors.light.background, Colors.light.accent + "15"]}
      style={styles.container}
    >
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: tabBarHeight + 100 + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ThemedText style={styles.greeting}>
            {greeting}, {displayName}
          </ThemedText>
          <ThemedText style={styles.tagline}>Ready for calm?</ThemedText>

          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{sessionsThisWeek}</ThemedText>
                <ThemedText style={styles.statLabel}>Sessions this week</ThemedText>
              </View>
            </View>
          </Card>

          {showTip ? (
            <Card style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <View style={styles.tipIconContainer}>
                  <Feather name="sun" size={20} color={Colors.light.primary} />
                </View>
                <ThemedText style={styles.tipTitle}>Wellness Tip</ThemedText>
                <Pressable
                  onPress={dismissTip}
                  hitSlop={8}
                  testID="button-dismiss-tip"
                >
                  <Feather name="x" size={20} color={Colors.light.textSecondary} />
                </Pressable>
              </View>
              <ThemedText style={styles.tipText}>{WELLNESS_TIPS[tipIndex]}</ThemedText>
            </Card>
          ) : null}
        </Animated.View>
      </Animated.ScrollView>

      <View
        style={[
          styles.fabContainer,
          { bottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={handleStartSession}
          testID="button-start-session"
        >
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primary + "DD"]}
            style={styles.fabGradient}
          >
            <Feather name="play" size={28} color={Colors.light.buttonText} />
            <ThemedText style={styles.fabText}>Start Session</ThemedText>
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flex: 1,
  },
  greeting: {
    ...Typography.headline,
    color: Colors.light.text,
  },
  tagline: {
    ...Typography.title,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing["2xl"],
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...Typography.headline,
    fontSize: 36,
    color: Colors.light.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  tipCard: {
    backgroundColor: Colors.light.accent + "20",
    borderWidth: 1,
    borderColor: Colors.light.accent + "40",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  tipTitle: {
    ...Typography.button,
    color: Colors.light.text,
    flex: 1,
  },
  tipText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    borderRadius: BorderRadius.lg,
    ...Shadows.fab,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
  },
  fabText: {
    ...Typography.button,
    color: Colors.light.buttonText,
    marginLeft: Spacing.sm,
  },
});
