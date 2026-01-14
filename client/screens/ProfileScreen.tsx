import React, { useState } from "react";
import { View, StyleSheet, Pressable, Image, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

import avatarBlue from "../../assets/images/avatar-dragonfly-blue.png";
import avatarGreen from "../../assets/images/avatar-dragonfly-green.png";
import avatarPurple from "../../assets/images/avatar-dragonfly-purple.png";
import avatarPink from "../../assets/images/avatar-dragonfly-pink.png";

const AVATARS = [
  { id: "blue", source: avatarBlue },
  { id: "green", source: avatarGreen },
  { id: "purple", source: avatarPurple },
  { id: "pink", source: avatarPink },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { preferences, sessions, onboarding, updatePreferences } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(preferences.displayName);

  const currentAvatar = AVATARS.find((a) => a.id === preferences.avatarId) || AVATARS[0];

  const handleAvatarSelect = async (avatarId: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updatePreferences({ avatarId });
  };

  const handleSaveName = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updatePreferences({ displayName: name || "Friend" });
    setEditingName(false);
  };

  const isMinor = onboarding.age !== null && onboarding.age < 18;

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
      <ThemedText style={styles.title}>Profile</ThemedText>

      <View style={styles.avatarSection}>
        <Image source={currentAvatar.source} style={styles.avatarLarge} />
        
        <View style={styles.avatarOptions}>
          {AVATARS.map((avatar) => (
            <Pressable
              key={avatar.id}
              style={({ pressed }) => [
                styles.avatarOption,
                avatar.id === preferences.avatarId && styles.avatarOptionSelected,
                pressed && styles.avatarOptionPressed,
              ]}
              onPress={() => handleAvatarSelect(avatar.id)}
              testID={`avatar-${avatar.id}`}
            >
              <Image source={avatar.source} style={styles.avatarSmall} />
            </Pressable>
          ))}
        </View>
      </View>

      <Card style={styles.nameCard}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.label}>Display Name</ThemedText>
          {editingName ? (
            <Pressable onPress={handleSaveName} testID="button-save-name">
              <Feather name="check" size={20} color={Colors.light.primary} />
            </Pressable>
          ) : (
            <Pressable onPress={() => setEditingName(true)} testID="button-edit-name">
              <Feather name="edit-2" size={20} color={Colors.light.textSecondary} />
            </Pressable>
          )}
        </View>
        {editingName ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.light.textSecondary}
            autoFocus
            onBlur={handleSaveName}
            testID="input-name"
          />
        ) : (
          <ThemedText style={styles.nameValue}>
            {preferences.displayName || "Friend"}
          </ThemedText>
        )}
      </Card>

      {isMinor ? (
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Feather name="shield" size={16} color={Colors.light.primary} />
            <ThemedText style={styles.badgeText}>Guardian Verified</ThemedText>
          </View>
        </View>
      ) : null}

      <Card style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statIcon}>
            <Feather name="activity" size={24} color={Colors.light.accent} />
          </View>
          <View style={styles.statInfo}>
            <ThemedText style={styles.statValue}>{sessions.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Sessions</ThemedText>
          </View>
        </View>
      </Card>
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
    marginBottom: Spacing["2xl"],
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.lg,
  },
  avatarOptions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  avatarOptionSelected: {
    borderColor: Colors.light.primary,
  },
  avatarOptionPressed: {
    opacity: 0.7,
  },
  avatarSmall: {
    width: "100%",
    height: "100%",
  },
  nameCard: {
    marginBottom: Spacing.lg,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  nameValue: {
    ...Typography.title,
    color: Colors.light.text,
  },
  nameInput: {
    ...Typography.title,
    color: Colors.light.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.primary,
    paddingBottom: Spacing.xs,
  },
  badgeContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.accent + "30",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.light.primary,
    marginLeft: Spacing.sm,
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.accent + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...Typography.headline,
    color: Colors.light.text,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
});
