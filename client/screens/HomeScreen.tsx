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
import type { SessionSite, SessionDuration } from "@/types";
import { SESSION_SITE_LABELS, SESSION_DURATION_LABELS } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SITES: SessionSite[] = [
  'arm-left', 'arm-right', 
  'thigh-left', 'thigh-right', 
  'abdomen-left', 'abdomen-right',
  'other'
];

const DURATIONS: SessionDuration[] = [24, 30, 42];

const SITE_ICONS: Record<SessionSite, string> = {
  'arm-left': 'circle',
  'arm-right': 'circle',
  'thigh-left': 'circle',
  'thigh-right': 'circle',
  'abdomen-left': 'circle',
  'abdomen-right': 'circle',
  'other': 'more-horizontal',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { preferences, sessionsThisWeek, updatePreferences } = useApp();
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);
  const [selectedSite, setSelectedSite] = useState<SessionSite | undefined>(preferences.lastSelectedSite);
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(preferences.selectedDuration || 24);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * WELLNESS_TIPS.length));
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (preferences.lastSelectedSite) {
      setSelectedSite(preferences.lastSelectedSite);
    }
    if (preferences.selectedDuration) {
      setSelectedDuration(preferences.selectedDuration);
    }
  }, [preferences.lastSelectedSite, preferences.selectedDuration]);

  const displayName = preferences.displayName || "Friend";
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  const handleSiteSelect = async (site: SessionSite) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSite(site);
    await updatePreferences({ lastSelectedSite: site });
  };

  const handleDurationSelect = async (duration: SessionDuration) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDuration(duration);
    await updatePreferences({ selectedDuration: duration });
  };

  const handleStartSession = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate("Session", { 
      site: selectedSite,
      duration: selectedDuration 
    });
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

          <ThemedText style={styles.sectionTitle}>Select Site</ThemedText>
          <Card style={styles.siteCard}>
            <View style={styles.siteGrid}>
              {SITES.map((site) => (
                <Pressable
                  key={site}
                  style={({ pressed }) => [
                    styles.siteButton,
                    selectedSite === site && styles.siteButtonSelected,
                    pressed && styles.siteButtonPressed,
                  ]}
                  onPress={() => handleSiteSelect(site)}
                  testID={`button-site-${site}`}
                >
                  <Feather 
                    name={SITE_ICONS[site] as any} 
                    size={16} 
                    color={selectedSite === site ? Colors.light.buttonText : Colors.light.textSecondary} 
                  />
                  <ThemedText
                    style={[
                      styles.siteButtonText,
                      selectedSite === site && styles.siteButtonTextSelected,
                    ]}
                  >
                    {SESSION_SITE_LABELS[site]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Card>

          <ThemedText style={styles.sectionTitle}>Session Duration</ThemedText>
          <Card style={styles.durationCard}>
            <View style={styles.durationRow}>
              {DURATIONS.map((duration) => (
                <Pressable
                  key={duration}
                  style={({ pressed }) => [
                    styles.durationButton,
                    selectedDuration === duration && styles.durationButtonSelected,
                    pressed && styles.durationButtonPressed,
                  ]}
                  onPress={() => handleDurationSelect(duration)}
                  testID={`button-duration-${duration}`}
                >
                  <ThemedText
                    style={[
                      styles.durationValue,
                      selectedDuration === duration && styles.durationValueSelected,
                    ]}
                  >
                    {duration}s
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.durationLabel,
                      selectedDuration === duration && styles.durationLabelSelected,
                    ]}
                  >
                    {duration === 24 ? 'Quick' : duration === 30 ? 'Standard' : 'Extended'}
                  </ThemedText>
                </Pressable>
              ))}
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
  sectionTitle: {
    ...Typography.button,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  siteCard: {
    marginBottom: Spacing.lg,
  },
  siteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  siteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.xs,
  },
  siteButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  siteButtonPressed: {
    opacity: 0.7,
  },
  siteButtonText: {
    ...Typography.caption,
    color: Colors.light.text,
  },
  siteButtonTextSelected: {
    color: Colors.light.buttonText,
  },
  durationCard: {
    marginBottom: Spacing.lg,
  },
  durationRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  durationButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  durationButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  durationButtonPressed: {
    opacity: 0.7,
  },
  durationValue: {
    ...Typography.title,
    color: Colors.light.text,
  },
  durationValueSelected: {
    color: Colors.light.buttonText,
  },
  durationLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  durationLabelSelected: {
    color: Colors.light.buttonText,
    opacity: 0.9,
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
