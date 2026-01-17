// client/components/SensoryProfileSelector.tsx
// Sensory Profile Selection UI with iPhone-optimized descriptions

import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { SensoryProfile, TextureVariation } from "@/services/audio/ExpoAVAudioEngine";
import { SensoryService } from "@/services/SensoryService";

interface SensoryProfileSelectorProps {
  selectedProfile: SensoryProfile;
  selectedTexture: TextureVariation;
  onProfileChange: (profile: SensoryProfile) => void;
  onTextureChange: (texture: TextureVariation) => void;
}

// Profile descriptions optimized for wellness positioning
const PROFILE_INFO: Record<SensoryProfile, { 
  icon: string; 
  description: string; 
  bestFor: string;
  frequency: string;
}> = {
  edge: {
    icon: "zap",
    description: "Crisp, focused sensation for precision comfort",
    bestFor: "Small or sensitive areas, fingertips",
    frequency: "200-260 Hz (bone waveguide)",
  },
  buffer: {
    icon: "shield",
    description: "Protective shield that spreads gentle comfort",
    bestFor: "Larger surface areas, SubQ sites",
    frequency: "140-180 Hz (dermal shield)",
  },
  deepwave: {
    icon: "activity",
    description: "Deep vibes that penetrate for lasting comfort",
    bestFor: "IM sites, deeper muscle areas",
    frequency: "180 Hz (bulk driver)",
  },
  rhythmiclayers: {
    icon: "layers",
    description: "Adaptive blend - start here if unsure",
    bestFor: "General use, discovery sessions",
    frequency: "200 Hz (AM modulation)",
  },
};

const TEXTURE_INFO: Record<TextureVariation, {
  icon: string;
  description: string;
}> = {
  constantflow: {
    icon: "minus",
    description: "Steady, continuous sensation",
  },
  rhythmicwaves: {
    icon: "bar-chart-2",
    description: "Pulsed rhythm at 100 BPM",
  },
  adaptiveflow: {
    icon: "trending-up",
    description: "Sweeping pattern (4s cycle)",
  },
};

export function SensoryProfileSelector({
  selectedProfile,
  selectedTexture,
  onProfileChange,
  onTextureChange,
}: SensoryProfileSelectorProps) {
  const profiles = SensoryService.getAvailableProfiles();
  const textures = SensoryService.getAvailableTextures();

  return (
    <View style={styles.container}>
      {/* Profile Selection */}
      <ThemedText style={styles.sectionTitle}>Sensory Profile</ThemedText>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.profileScroll}
      >
        {profiles.map((profile) => {
          const info = PROFILE_INFO[profile];
          const isSelected = selectedProfile === profile;
          
          return (
            <Pressable
              key={profile}
              style={[
                styles.profileCard,
                isSelected && styles.profileCardSelected,
              ]}
              onPress={() => onProfileChange(profile)}
            >
              <View style={[
                styles.profileIcon,
                isSelected && styles.profileIconSelected,
              ]}>
                <Feather 
                  name={info.icon as any} 
                  size={24} 
                  color={isSelected ? "#FFFFFF" : Colors.light.primary}
                />
              </View>
              <ThemedText style={[
                styles.profileName,
                isSelected && styles.profileNameSelected,
              ]}>
                {SensoryService.getProfileDisplayName(profile)}
              </ThemedText>
              <ThemedText style={styles.profileDescription}>
                {info.description}
              </ThemedText>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Selected Profile Details */}
      <View style={styles.detailsCard}>
        <ThemedText style={styles.detailsTitle}>
          {SensoryService.getProfileDisplayName(selectedProfile)} Details
        </ThemedText>
        <View style={styles.detailRow}>
          <Feather name="target" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>
            Best for: {PROFILE_INFO[selectedProfile].bestFor}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Feather name="radio" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>
            {PROFILE_INFO[selectedProfile].frequency}
          </ThemedText>
        </View>
      </View>

      {/* Texture Selection */}
      <ThemedText style={styles.sectionTitle}>Texture Variation</ThemedText>
      <View style={styles.textureContainer}>
        {textures.map((texture) => {
          const info = TEXTURE_INFO[texture];
          const isSelected = selectedTexture === texture;
          
          return (
            <Pressable
              key={texture}
              style={[
                styles.textureButton,
                isSelected && styles.textureButtonSelected,
              ]}
              onPress={() => onTextureChange(texture)}
            >
              <Feather 
                name={info.icon as any} 
                size={18} 
                color={isSelected ? "#FFFFFF" : Colors.light.text}
              />
              <ThemedText style={[
                styles.textureName,
                isSelected && styles.textureNameSelected,
              ]}>
                {SensoryService.getTextureDisplayName(texture)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <ThemedText style={styles.textureDescription}>
        {TEXTURE_INFO[selectedTexture].description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  profileScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  profileCard: {
    width: 140,
    padding: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  profileCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + "10",
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  profileIconSelected: {
    backgroundColor: Colors.light.primary,
  },
  profileName: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  profileNameSelected: {
    color: Colors.light.primary,
  },
  profileDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsCard: {
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  detailsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  textureContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  textureButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textureButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  textureName: {
    fontSize: Typography.sizes.xs,
    fontWeight: "500",
    color: Colors.light.text,
  },
  textureNameSelected: {
    color: "#FFFFFF",
  },
  textureDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});
