import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { COLORS } from "../constants/Colors";
import { DISCLAIMERS } from "../constants/DisclaimerText";
import StorageService from "../services/StorageService";

export default function SettingsScreen({ navigation }: any) {
  const handleClearData = () => {
    Alert.alert(
      "Clear All Data?",
      "This will permanently delete all your session history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await StorageService.clearAllData();
            Alert.alert("Success", "All data cleared");
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Disclaimer Section */}
      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerTitle}>⚠️ Important Information</Text>
        <Text style={styles.disclaimerText}>{DISCLAIMERS.MASTER}</Text>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT ALIVIO EASE</Text>

        <View style={styles.badgeContainer}>
          <Text style={styles.badge}>Developed by ER Physicians</Text>
          <Text style={styles.badgeNote}>
            Created by healthcare professionals. This wellness tool is not a
            medical device and does not replace professional medical advice.
          </Text>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>

        <TouchableOpacity style={styles.dataButton} onPress={handleClearData}>
          <Text style={[styles.dataButtonText, styles.deleteText]}>
            Clear All Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{DISCLAIMERS.IOS_SHORT}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    padding: 20,
    paddingTop: 60,
    color: COLORS.DARK_GRAY,
  },
  disclaimerSection: {
    backgroundColor: COLORS.DISCLAIMER_BG,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.DISCLAIMER_BORDER,
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.DISCLAIMER_TEXT,
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 13,
    color: COLORS.DISCLAIMER_TEXT,
    lineHeight: 20,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.SOFT_GRAY,
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  badgeContainer: {
    marginBottom: 20,
  },
  badge: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.MEDICAL_BLUE,
    marginBottom: 5,
  },
  badgeNote: {
    fontSize: 12,
    color: COLORS.SOFT_GRAY,
    fontStyle: "italic",
  },
  versionText: {
    fontSize: 14,
    color: COLORS.SOFT_GRAY,
  },
  dataButton: {
    padding: 16,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 8,
    alignItems: "center",
  },
  dataButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteText: {
    color: COLORS.ALERT_RED,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: COLORS.SOFT_GRAY,
    textAlign: "center",
  },
});
