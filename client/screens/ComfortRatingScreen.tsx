import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { COMFORT_LABELS } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { ComfortRating, SessionLog } from "@/types";

type RouteProp = NativeStackScreenProps<RootStackParamList, "ComfortRating">["route"];
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RATINGS: ComfortRating[] = [1, 2, 3, 4, 5];

export default function ComfortRatingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { addSession } = useApp();
  const { duration, hapticPattern } = route.params;
  
  const [selectedRating, setSelectedRating] = useState<ComfortRating | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const handleRatingSelect = async (rating: ComfortRating) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedRating(rating);
  };

  const handleSave = async () => {
    if (selectedRating === null) return;

    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const session: SessionLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration,
      hapticPattern,
      comfortRating: selectedRating,
      notes: notes.trim() || undefined,
    };

    await addSession(session);
    navigation.navigate("Main");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing["3xl"] }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>How do you feel?</ThemedText>
        <ThemedText style={styles.subtitle}>
          Rate your comfort level after this session
        </ThemedText>

        <View style={styles.ratingsContainer}>
          {RATINGS.map((rating) => (
            <Pressable
              key={rating}
              style={({ pressed }) => [
                styles.ratingButton,
                selectedRating === rating && styles.ratingButtonSelected,
                pressed && styles.ratingButtonPressed,
              ]}
              onPress={() => handleRatingSelect(rating)}
              testID={`rating-${rating}`}
            >
              <ThemedText
                style={[
                  styles.ratingText,
                  selectedRating === rating && styles.ratingTextSelected,
                ]}
              >
                {COMFORT_LABELS[rating]}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {showNotes ? (
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about your session..."
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="input-notes"
            />
          </View>
        ) : (
          <Pressable
            style={styles.addNotesButton}
            onPress={() => setShowNotes(true)}
            testID="button-add-notes"
          >
            <Feather name="edit-3" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={styles.addNotesText}>Add notes</ThemedText>
          </Pressable>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            selectedRating === null && styles.saveButtonDisabled,
            pressed && selectedRating !== null && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={selectedRating === null}
          testID="button-save"
        >
          <ThemedText style={styles.saveButtonText}>Save & Close</ThemedText>
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
    paddingHorizontal: Spacing.xl,
  },
  title: {
    ...Typography.headline,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  ratingsContainer: {
    gap: Spacing.md,
  },
  ratingButton: {
    backgroundColor: Colors.light.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  ratingButtonSelected: {
    backgroundColor: Colors.light.accent + "30",
    borderColor: Colors.light.accent,
  },
  ratingButtonPressed: {
    opacity: 0.7,
  },
  ratingText: {
    ...Typography.button,
    color: Colors.light.text,
  },
  ratingTextSelected: {
    color: Colors.light.text,
  },
  addNotesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  addNotesText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.sm,
  },
  notesContainer: {
    marginTop: Spacing.xl,
  },
  notesInput: {
    ...Typography.body,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
  },
});
