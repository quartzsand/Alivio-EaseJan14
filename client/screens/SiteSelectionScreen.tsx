// client/screens/SiteSelectionScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { INJECTION_SITES, InjectionSite } from "../constants/InjectionSites";

interface Props {
  onSiteSelected: (site: InjectionSite) => void;
  selectedMedicationType?: string;
}

export default function SiteSelectionScreen({
  onSiteSelected,
  selectedMedicationType,
}: Props) {
  const [selectedSite, setSelectedSite] = useState<InjectionSite | null>(null);

  // Filter sites based on medication type if provided
  const availableSites = selectedMedicationType
    ? INJECTION_SITES.filter((site) =>
        site.recommendedFor.includes(selectedMedicationType),
      )
    : INJECTION_SITES;

  const handleSiteSelection = (site: InjectionSite) => {
    setSelectedSite(site);
  };

  const handleContinue = () => {
    if (selectedSite) {
      onSiteSelected(selectedSite);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Injection Site</Text>
        <Text style={styles.subtitle}>
          Choose where you'll be giving the injection
        </Text>
      </View>

      <ScrollView
        style={styles.sitesContainer}
        showsVerticalScrollIndicator={false}
      >
        {availableSites.map((site) => {
          const isSelected = selectedSite?.id === site.id;

          return (
            <TouchableOpacity
              key={site.id}
              style={[styles.siteCard, isSelected && styles.selectedSiteCard]}
              onPress={() => handleSiteSelection(site)}
              activeOpacity={0.7}
            >
              <View style={styles.siteHeader}>
                <View style={styles.siteIconContainer}>
                  <Text style={styles.siteEmoji}>{site.emoji}</Text>
                </View>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <Text style={styles.anatomicalName}>
                    {site.anatomicalName}
                  </Text>
                  <Text style={styles.siteDescription}>{site.description}</Text>
                </View>
                <View style={styles.selectionIndicator}>
                  {isSelected && (
                    <Feather name="check-circle" size={24} color="#2ECC71" />
                  )}
                </View>
              </View>

              {isSelected && (
                <View style={styles.siteDetails}>
                  <Text style={styles.tipsHeader}>Tips for this site:</Text>
                  {site.tips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <Feather name="info" size={14} color="#7F8C8D" />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.bottomContainer}>
        {selectedSite && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              Continue with {selectedSite.name}
            </Text>
          </TouchableOpacity>
        )}
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
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
  },
  sitesContainer: {
    flex: 1,
    padding: 20,
  },
  siteCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#ECF0F1",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedSiteCard: {
    borderColor: "#2ECC71",
    backgroundColor: "#F8FFF8",
  },
  siteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  siteIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EBF3FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  siteEmoji: {
    fontSize: 28,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  anatomicalName: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 6,
  },
  siteDescription: {
    fontSize: 16,
    color: "#34495E",
    lineHeight: 20,
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  siteDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#ECF0F1",
  },
  tipsHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  bottomContainer: {
    padding: 20,
  },
  continueButton: {
    backgroundColor: "#3498DB",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
});
