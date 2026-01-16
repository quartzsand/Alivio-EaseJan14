// src/components/SensoryProfileSelector.tsx (Enhanced with Test Profiles)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import {
  TestProfileService,
  TestProfile,
} from "../services/TestProfileService";

export default function SensoryProfileSelector({ onSelectionComplete }) {
  const [showTestProfiles, setShowTestProfiles] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedTestProfile, setSelectedTestProfile] = useState(null);

  // Check if test profiles should be shown
  useEffect(() => {
    checkTestProfilesEnabled();
  }, []);

  const checkTestProfilesEnabled = async () => {
    const enabled = await TestProfileService.isTestProfileEnabled();
    setShowTestProfiles(enabled);
  };

  const handleTestProfileSelect = (testProfile: TestProfile) => {
    Alert.alert(
      "Test Profile Selected",
      `${testProfile.user_name}\n\nScientific Basis: ${testProfile.scientific_basis}\n\nTarget: ${testProfile.validation_target}\n\nThis is a validation profile designed for technical testing.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Test",
          onPress: () => {
            onSelectionComplete({
              isTestProfile: true,
              testProfile: testProfile,
              audioFile: `test-${testProfile.id}-${testProfile.duration}s.wav`,
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose Your Sensory Experience</Text>

      {/* Main Wellness Profiles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wellness Profiles</Text>

        {/* Standard sensory profiles */}
        {Object.entries(SENSORY_PROFILES).map(([key, profile]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.profileOption,
              selectedProfile === key && styles.selectedOption,
            ]}
            onPress={() => setSelectedProfile(key)}
          >
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileDescription}>{profile.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Test Profiles Section (Conditionally Shown) */}
      {showTestProfiles && (
        <View style={styles.testSection}>
          <Text style={styles.testSectionTitle}>
            🧪 Validation Test Profiles
          </Text>
          <Text style={styles.testSectionDescription}>
            Technical validation profiles for research and development
          </Text>

          {TestProfileService.getAllTestProfiles().map((testProfile) => (
            <TouchableOpacity
              key={testProfile.id}
              style={styles.testProfileOption}
              onPress={() => handleTestProfileSelect(testProfile)}
            >
              <View style={styles.testProfileHeader}>
                <Text style={styles.testProfileName}>
                  {testProfile.user_name}
                </Text>
                <Text style={styles.testProfileBadge}>TEST</Text>
              </View>
              <Text style={styles.testProfileBasis}>
                {testProfile.scientific_basis}
              </Text>
              <Text style={styles.testProfileTarget}>
                Target: {testProfile.validation_target}
              </Text>
              <Text style={styles.testProfileFreq}>
                {testProfile.primary_freq}Hz • {testProfile.duration}s •{" "}
                {testProfile.texture}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.testDisclaimer}>
            <Text style={styles.testDisclaimerText}>
              ⚠️ Test profiles are designed for technical validation and may
              feel different from wellness profiles. Use for research purposes
              only.
            </Text>
          </View>
        </View>
      )}

      {/* Continue with texture and duration selection for main profiles... */}
      {selectedProfile && (
        <View style={styles.section}>{/* Texture selection UI */}</View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 12,
  },

  // Test Profile Styles
  testSection: {
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#f39c12",
  },
  testSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#d68910",
    marginBottom: 8,
  },
  testSectionDescription: {
    fontSize: 14,
    color: "#935116",
    marginBottom: 16,
    lineHeight: 18,
  },
  testProfileOption: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f39c12",
  },
  testProfileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  testProfileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d68910",
    flex: 1,
  },
  testProfileBadge: {
    backgroundColor: "#e67e22",
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testProfileBasis: {
    fontSize: 14,
    color: "#935116",
    marginBottom: 4,
    fontStyle: "italic",
  },
  testProfileTarget: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 4,
  },
  testProfileFreq: {
    fontSize: 12,
    color: "#dc3545",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  testDisclaimer: {
    backgroundColor: "#ffeaa7",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  testDisclaimerText: {
    fontSize: 12,
    color: "#2d3436",
    lineHeight: 16,
    textAlign: "center",
  },
});
