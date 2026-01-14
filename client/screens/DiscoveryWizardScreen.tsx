import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { SensoryEngine } from "@/services/SensoryEngine";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { SessionSite, SiteTuning, PeakStyle } from "@/types";
import { SESSION_SITE_LABELS } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DiscoveryRouteProp = RouteProp<RootStackParamList, 'DiscoveryWizard'>;

const SITES: SessionSite[] = [
  'arm-left', 'arm-right', 
  'thigh-left', 'thigh-right', 
  'abdomen-left', 'abdomen-right',
  'other'
];

type WizardStep = 'site-select' | 'intensity' | 'snap-density' | 'peak-style' | 'audio' | 'complete';

export default function DiscoveryWizardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DiscoveryRouteProp>();
  const { preferences, saveSiteTuning, getSiteTuning, updatePreferences } = useApp();

  const [step, setStep] = useState<WizardStep>('site-select');
  const [selectedSite, setSelectedSite] = useState<SessionSite | undefined>(route.params?.site);
  
  const [hapticIntensity, setHapticIntensity] = useState(0.5);
  const [snapDensity, setSnapDensity] = useState(0.5);
  const [peakStyle, setPeakStyle] = useState<PeakStyle>('max');
  const [audioVolume, setAudioVolume] = useState(0.7);

  useEffect(() => {
    if (selectedSite) {
      const existingTuning = getSiteTuning(selectedSite);
      if (existingTuning) {
        setHapticIntensity(existingTuning.hapticIntensity);
        setSnapDensity(existingTuning.snapDensity);
        setPeakStyle(existingTuning.peakStyle);
        setAudioVolume(existingTuning.audioVolume);
      } else {
        setHapticIntensity(preferences.hapticIntensity);
        setSnapDensity(preferences.snapDensity);
        setPeakStyle(preferences.peakStyle);
        setAudioVolume(preferences.audioVolume);
      }
    }
  }, [selectedSite, getSiteTuning, preferences]);

  const handleSiteSelect = async (site: SessionSite) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSite(site);
    setStep('intensity');
  };

  const handleTestHaptic = async () => {
    SensoryEngine.setIntensity(hapticIntensity);
    SensoryEngine.setSnapDensity(snapDensity);
    SensoryEngine.setPeakStyle(peakStyle);
    
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(resolve => setTimeout(resolve, 150));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleNext = () => {
    if (step === 'site-select' && !selectedSite) {
      return;
    }
    const steps: WizardStep[] = ['site-select', 'intensity', 'snap-density', 'peak-style', 'audio', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['site-select', 'intensity', 'snap-density', 'peak-style', 'audio', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = async () => {
    if (!selectedSite) {
      return;
    }
    
    const tuning: SiteTuning = {
      hapticIntensity,
      snapDensity,
      peakStyle,
      audioVolume,
    };
    await saveSiteTuning(selectedSite, tuning);
    await updatePreferences({ discoveryCompleted: true });
    
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  };

  const renderSiteSelect = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Choose a Site</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Select where you'd like to tune your comfort settings
      </ThemedText>
      
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
            testID={`button-wizard-site-${site}`}
          >
            <Feather 
              name="circle" 
              size={18} 
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
    </View>
  );

  const renderIntensityStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Haptic Intensity</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Adjust how strong the vibrations feel for {selectedSite ? SESSION_SITE_LABELS[selectedSite] : 'this site'}
      </ThemedText>
      
      <Card style={styles.tuningCard}>
        <View style={styles.sliderContainer}>
          <ThemedText style={styles.sliderLabel}>Gentle</ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            value={hapticIntensity}
            onValueChange={setHapticIntensity}
            minimumTrackTintColor={Colors.light.primary}
            maximumTrackTintColor={Colors.light.border}
            thumbTintColor={Colors.light.primary}
            testID="slider-wizard-intensity"
          />
          <ThemedText style={styles.sliderLabel}>Strong</ThemedText>
        </View>
        
        <Pressable
          style={({ pressed }) => [styles.testButton, pressed && styles.testButtonPressed]}
          onPress={handleTestHaptic}
          testID="button-test-haptic"
        >
          <Feather name="zap" size={18} color={Colors.light.primary} />
          <ThemedText style={styles.testButtonText}>Test Haptic</ThemedText>
        </Pressable>
      </Card>
    </View>
  );

  const renderSnapDensityStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Snap Density</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Control how frequently haptic pulses occur
      </ThemedText>
      
      <Card style={styles.tuningCard}>
        <View style={styles.sliderContainer}>
          <ThemedText style={styles.sliderLabel}>Sparse</ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            value={snapDensity}
            onValueChange={setSnapDensity}
            minimumTrackTintColor={Colors.light.accent}
            maximumTrackTintColor={Colors.light.border}
            thumbTintColor={Colors.light.accent}
            testID="slider-wizard-snap"
          />
          <ThemedText style={styles.sliderLabel}>Dense</ThemedText>
        </View>
        
        <Pressable
          style={({ pressed }) => [styles.testButton, pressed && styles.testButtonPressed]}
          onPress={handleTestHaptic}
          testID="button-test-snap"
        >
          <Feather name="zap" size={18} color={Colors.light.primary} />
          <ThemedText style={styles.testButtonText}>Test Haptic</ThemedText>
        </Pressable>
      </Card>
    </View>
  );

  const renderPeakStyleStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Peak Style</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Choose how haptics behave during the peak phase
      </ThemedText>
      
      <Card style={styles.tuningCard}>
        <View style={styles.peakStyleOptions}>
          <Pressable
            style={({ pressed }) => [
              styles.peakOption,
              peakStyle === 'max' && styles.peakOptionSelected,
              pressed && styles.peakOptionPressed,
            ]}
            onPress={() => setPeakStyle('max')}
            testID="button-peak-max"
          >
            <Feather 
              name="maximize-2" 
              size={24} 
              color={peakStyle === 'max' ? Colors.light.buttonText : Colors.light.text} 
            />
            <ThemedText style={[styles.peakOptionTitle, peakStyle === 'max' && styles.peakOptionTitleSelected]}>
              Max
            </ThemedText>
            <ThemedText style={[styles.peakOptionDesc, peakStyle === 'max' && styles.peakOptionDescSelected]}>
              Sustained intensity at maximum during peak
            </ThemedText>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.peakOption,
              peakStyle === 'snap' && styles.peakOptionSelected,
              pressed && styles.peakOptionPressed,
            ]}
            onPress={() => setPeakStyle('snap')}
            testID="button-peak-snap"
          >
            <Feather 
              name="activity" 
              size={24} 
              color={peakStyle === 'snap' ? Colors.light.buttonText : Colors.light.text} 
            />
            <ThemedText style={[styles.peakOptionTitle, peakStyle === 'snap' && styles.peakOptionTitleSelected]}>
              Snap
            </ThemedText>
            <ThemedText style={[styles.peakOptionDesc, peakStyle === 'snap' && styles.peakOptionDescSelected]}>
              Quick bursts with rest between
            </ThemedText>
          </Pressable>
        </View>
      </Card>
    </View>
  );

  const renderAudioStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Audio Volume</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Set the background audio level for this site
      </ThemedText>
      
      <Card style={styles.tuningCard}>
        <View style={styles.sliderContainer}>
          <ThemedText style={styles.sliderLabel}>Low</ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            value={audioVolume}
            onValueChange={setAudioVolume}
            minimumTrackTintColor={Colors.light.primary}
            maximumTrackTintColor={Colors.light.border}
            thumbTintColor={Colors.light.primary}
            testID="slider-wizard-audio"
          />
          <ThemedText style={styles.sliderLabel}>High</ThemedText>
        </View>
      </Card>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContent}>
      <View style={styles.completeIcon}>
        <Feather name="check-circle" size={64} color={Colors.light.success} />
      </View>
      <ThemedText style={styles.stepTitle}>All Set!</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Your settings for {selectedSite ? SESSION_SITE_LABELS[selectedSite] : 'this site'} have been saved.
      </ThemedText>
      
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Intensity</ThemedText>
          <ThemedText style={styles.summaryValue}>{Math.round(hapticIntensity * 100)}%</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Snap Density</ThemedText>
          <ThemedText style={styles.summaryValue}>{Math.round(snapDensity * 100)}%</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Peak Style</ThemedText>
          <ThemedText style={styles.summaryValue}>{peakStyle === 'max' ? 'Max' : 'Snap'}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Audio Volume</ThemedText>
          <ThemedText style={styles.summaryValue}>{Math.round(audioVolume * 100)}%</ThemedText>
        </View>
      </Card>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'site-select': return renderSiteSelect();
      case 'intensity': return renderIntensityStep();
      case 'snap-density': return renderSnapDensityStep();
      case 'peak-style': return renderPeakStyleStep();
      case 'audio': return renderAudioStep();
      case 'complete': return renderComplete();
    }
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = ['site-select', 'intensity', 'snap-density', 'peak-style', 'audio', 'complete'];
    return steps.indexOf(step) + 1;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={() => navigation.goBack()}
          testID="button-close-wizard"
        >
          <Feather name="x" size={24} color={Colors.light.text} />
        </Pressable>
        
        <View style={styles.progress}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <View 
              key={num} 
              style={[
                styles.progressDot,
                num <= getStepNumber() && styles.progressDotActive,
              ]} 
            />
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {step !== 'site-select' && (
          <View style={styles.footerButtons}>
            {step !== 'complete' ? (
              <>
                <Button
                  title="Back"
                  onPress={handleBack}
                  variant="outline"
                  style={styles.footerButton}
                  testID="button-wizard-back"
                />
                <Button
                  title="Next"
                  onPress={handleNext}
                  style={styles.footerButton}
                  testID="button-wizard-next"
                />
              </>
            ) : (
              <Button
                title="Save & Close"
                onPress={handleSave}
                style={styles.footerButtonFull}
                testID="button-wizard-save"
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  progressDotActive: {
    backgroundColor: Colors.light.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.headline,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  siteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  siteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.sm,
    minWidth: 140,
  },
  siteButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  siteButtonPressed: {
    opacity: 0.7,
  },
  siteButtonText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  siteButtonTextSelected: {
    color: Colors.light.buttonText,
  },
  tuningCard: {
    padding: Spacing.xl,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    width: 50,
    textAlign: "center",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + "15",
    gap: Spacing.sm,
  },
  testButtonPressed: {
    opacity: 0.7,
  },
  testButtonText: {
    ...Typography.button,
    color: Colors.light.primary,
  },
  peakStyleOptions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  peakOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  peakOptionSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  peakOptionPressed: {
    opacity: 0.7,
  },
  peakOptionTitle: {
    ...Typography.button,
    color: Colors.light.text,
    marginTop: Spacing.sm,
  },
  peakOptionTitleSelected: {
    color: Colors.light.buttonText,
  },
  peakOptionDesc: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  peakOptionDescSelected: {
    color: Colors.light.buttonText,
    opacity: 0.9,
  },
  completeIcon: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    marginTop: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + "50",
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    ...Typography.button,
    color: Colors.light.text,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  footerButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonFull: {
    flex: 1,
  },
});
