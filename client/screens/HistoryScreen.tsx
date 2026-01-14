import React from "react";
import { View, StyleSheet, FlatList, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { COMFORT_LABELS, HAPTIC_PATTERN_LABELS } from "@/types";
import type { SessionLog } from "@/types";

import emptyHistory from "../../assets/images/empty-history.png";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function SessionCard({ session }: { session: SessionLog }) {
  return (
    <Card style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <ThemedText style={styles.sessionDate}>{formatDate(session.date)}</ThemedText>
        <View style={styles.durationBadge}>
          <Feather name="clock" size={12} color={Colors.light.textSecondary} />
          <ThemedText style={styles.durationText}>{formatDuration(session.duration)}</ThemedText>
        </View>
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Pattern</ThemedText>
          <ThemedText style={styles.detailValue}>
            {HAPTIC_PATTERN_LABELS[session.hapticPattern]}
          </ThemedText>
        </View>
        
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Comfort</ThemedText>
          <View style={styles.comfortBadge}>
            <ThemedText style={styles.comfortText}>
              {COMFORT_LABELS[session.comfortRating]}
            </ThemedText>
          </View>
        </View>
      </View>
      
      {session.notes ? (
        <View style={styles.notesSection}>
          <ThemedText style={styles.notesLabel}>Notes</ThemedText>
          <ThemedText style={styles.notesText}>{session.notes}</ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Image source={emptyHistory} style={styles.emptyImage} resizeMode="contain" />
      <ThemedText style={styles.emptyTitle}>No sessions yet</ThemedText>
      <ThemedText style={styles.emptyText}>
        Start your first comfort session from the home screen
      </ThemedText>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { sessions } = useApp();

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: tabBarHeight + Spacing["2xl"],
          },
          sessions.length === 0 && styles.emptyContainer,
        ]}
        ListHeaderComponent={
          sessions.length > 0 ? (
            <ThemedText style={styles.title}>History</ThemedText>
          ) : null
        }
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...Typography.headline,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },
  sessionCard: {
    marginBottom: Spacing.md,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sessionDate: {
    ...Typography.button,
    color: Colors.light.text,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  durationText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.xs,
  },
  sessionDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.light.text,
  },
  comfortBadge: {
    backgroundColor: Colors.light.accent + "30",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  comfortText: {
    ...Typography.caption,
    color: Colors.light.text,
  },
  notesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  notesLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  notesText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
