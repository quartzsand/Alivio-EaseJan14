import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import StorageService from "../services/StorageService";
import { COLORS } from "../constants/Colors";
import { SessionLog } from "../types";

const { width } = Dimensions.get("window");

export default function ComfortRatingScreen({ route, navigation }: any) {
  const { duration, pattern, routineType } = route.params;
  const [comfortRating, setComfortRating] = useState<number | null>(null);

  const handleSave = async () => {
    if (!comfortRating) {
      return;
    }

    const sessionLog: SessionLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      duration,
      pattern,
      routineType,
      comfortRating,
    };

    await StorageService.saveSessionLog(sessionLog);
    navigation.navigate("Session");
  };

  const emojis = [
    { value: 1, emoji: "😰", label: "Very Uncomfortable" },
    { value: 2, emoji: "😟", label: "Uncomfortable" },
    { value: 3, emoji: "😕", label: "Somewhat Uncomfortable" },
    { value: 4, emoji: "😐", label: "Neutral" },
    { value: 5, emoji: "🙂", label: "Somewhat Comfortable" },
    { value: 6, emoji: "😊", label: "Comfortable" },
    { value: 7, emoji: "😀", label: "Very Comfortable" },
    { value: 8, emoji: "😄", label: "Quite Comfortable" },
    { value: 9, emoji: "😁", label: "Extremely Comfortable" },
    { value: 10, emoji: "🤩", label: "Completely at Ease" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Session Complete! 🎉</Text>
      <Text style={styles.subtitle}>How comfortable did you feel?</Text>

      <Text style={styles.ratingLabel}>Comfort with Injection</Text>

      <ScrollView contentContainerStyle={styles.emojiGrid}>
        {emojis.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.emojiButton,
              comfortRating === item.value && styles.emojiButtonSelected,
            ]}
            onPress={() => setComfortRating(item.value)}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.emojiValue}>{item.value}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, !comfortRating && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!comfortRating}
      >
        <Text style={styles.saveButtonText}>Save & Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.navigate("Session")}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.SUCCESS_GREEN,
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.WHITE,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.WHITE,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  ratingLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 20,
  },
  emojiButton: {
    width: 70,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 8,
  },
  emojiButtonSelected: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  emoji: {
    fontSize: 36,
  },
  emojiValue: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.SUCCESS_GREEN,
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    marginTop: 15,
    alignItems: "center",
  },
  skipText: {
    color: COLORS.WHITE,
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
