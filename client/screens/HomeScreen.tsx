// client/screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

export default function HomeScreen() {
  const navigation = useNavigation();

  const startSession = () => {
    // For now, go directly to session with default preferences
    navigation.navigate("Session", {
      preferences: {
        defaultDuration: 60,
        preferredSite: "thigh",
        vibrationIntensity: 0.7,
        audioEnabled: true,
        visualEffectsEnabled: true,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Alivio's Easel</Text>
        <Text style={styles.appSubtitle}>
          Comfort for your wellness journey
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>🦋</Text>
        </View>

        <Text style={styles.welcomeText}>
          Ready to start your comfort session?
        </Text>

        <TouchableOpacity style={styles.startButton} onPress={startSession}>
          <Feather name="play" size={24} color="white" />
          <Text style={styles.startButtonText}>Start Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Feather name="settings" size={20} color="#7F8C8D" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EBF3FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  iconEmoji: {
    fontSize: 60,
  },
  welcomeText: {
    fontSize: 18,
    color: "#34495E",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498DB",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingsButtonText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginLeft: 8,
  },
});
