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
import { HapticsService } from "@/services/HapticsService";
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

type WizardStep = 'site-select' | 'trial-abc' | 'fine-tune' | 'audio' | 'complete';

interface TrialPreset {
  id: 'A' | 'B' | 'C';
  label: string;
  description: string;
  intensity: number;
  snapDensity: number;
  peakStyle: PeakStyle;
}

const TRIAL_PRESETS: TrialPreset[] = [
  {
    id: 'A',
    label: 'Gentle',
    description: 'Light, steady pulses with gradual peak',
    intensity: 0.4,
    snapDensity: 0.3,
    peakStyle: 'max',
  },
  {
    id: 'B',
    label: 'Balanced',
    description: 'Medium intensity with rhythmic snaps',
    intensity: 0.6,
    snapDensity: 0.5,
    peakStyle: 'snap',
  },
  {
    id: 'C',
    label: 'Strong',
    description: 'Firm, pronounced feedback throughout',
    intensity: 0.8,
    snapDensity: 0.7,
    peakStyle: 'max',
  },
];

export default function DiscoveryWizardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DiscoveryRouteProp>();
  const { preferences, saveSiteTuning, getSiteTuning, updatePreferences, onboarding } = useApp();

  const [step, setStep] = useState<WizardStep>('site-select');
  const [selectedSite, setSelectedSite] = useState<SessionSite | undefined>(route.params?.site);
  const [selectedTrial, setSelectedTrial] = useState<'A' | 'B' | 'C' | null>(null);
  
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
    setStep('trial-abc');
  };

  const handleTrialTest = async (preset: TrialPreset) => {
    HapticsService.setIntensity(preset.intensity);
    HapticsService.setSnapDensity(preset.snapDensity);
    HapticsService.setPeakStyle(preset.peakStyle);
    
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await delay(100);
      await Haptics.impactAsync(preset.peakStyle === 'max' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
      await delay(80);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (preset.snapDensity > 0.5) {
        await delay(60);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const handleTrialSelect = async (trialId: 'A' | 'B' | 'C') => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTrial(trialId);
    const preset = TRIAL_PRESETS.find(p => p.id === trialId);
    if (preset) {
      setHapticIntensity(preset.intensity);
      setSnapDensity(preset.snapDensity);
      setPeakStyle(preset.peakStyle);
    }
  };

  const handleTestCurrent = async () => {
    HapticsService.setIntensity(hapticIntensity);
    HapticsService.setSnapDensity(snapDensity);
    HapticsService.setPeakStyle(peakStyle);
    
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await delay(100);
      await Haptics.impactAsync(peakStyle === 'max' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
      await delay(80);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = () => {
    if (step === 'site-select' && !selectedSite) {
      return;
    }
    if (step === 'trial-abc' && !selectedTrial) {
      return;
    }
    const steps: WizardStep[] = ['site-select', 'trial-abc', 'fine-tune', 'audio', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['site-select', 'trial-abc', 'fine-tune', 'audio', 'complete'];
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

  const renderTrialABC = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Try These Options</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Tap each option to feel it, then select your favorite
      </ThemedText>
      
      <View style={styles.trialsContainer}>
        {TRIAL_PRESETS.map((preset) => (
          <Card 
            key={preset.id} 
            style={[
              styles.trialCard,
              selectedTrial === preset.id && styles.trialCardSelected,
            ]}
          >
            <Pressable
              style={styles.trialContent}
              onPress={() => handleTrialSelect(preset.id)}
              testID={`button-trial-${preset.id}`}
            >
              <View style={styles.trialHeader}>
                <View style={[
                  styles.trialBadge,
                  selectedTrial === preset.id && styles.trialBadgeSelected,
                ]}>
                  <ThemedText style={[
                    styles.trialBadgeText,
                    selectedTrial === preset.id && styles.trialBadgeTextSelected,
                  ]}>
                    {preset.id}
                  </ThemedText>
                </View>
                <ThemedText style={styles.trialLabel}>{preset.label}</ThemedText>
                {selectedTrial === preset.id && (
                  <Feather name="check-circle" size={20} color={Colors.light.primary} />
                )}
              </View>
              <ThemedText style={styles.trialDescription}>{preset.description}</ThemedText>
              
              <Pressable
                style={({ pressed }) => [styles.tryButton, pressed && styles.tryButtonPressed]}
                onPress={() => handleTrialTest(preset)}
                testID={`button-try-${preset.id}`}
              >
                <Feather name="zap" size={16} color={Colors.light.primary} />
                <ThemedText style={styles.tryButtonText}>Try</ThemedText>
              </Pressable>
            </Pressable>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderFineTune = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Fine-Tune</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Adjust settings based on your selection
      </ThemedText>
      
      <Card style={styles.tuningCard}>
        <ThemedText style={styles.tuningLabel}>Intensity</ThemedText>
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

        <View style={styles.divider} />

        <ThemedText style={styles.tuningLabel}>Peak Style</ThemedText>
        <View style={styles.segmented}>
          <Pressable
            style={({ pressed }) => [
              styles.segButton,
              peakStyle === 'max' && styles.segButtonSelected,
              pressed && styles.segButtonPressed,
            ]}
            onPress={() => setPeakStyle('max')}
            testID="button-peak-max"
          >
            <ThemedText style={[styles.segButtonText, peakStyle === 'max' && styles.segButtonTextSelected]}>
              Max
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.segButton,
              peakStyle === 'snap' && styles.segButtonSelected,
              pressed && styles.segButtonPressed,
            ]}
            onPress={() => setPeakStyle('snap')}
            testID="button-peak-snap"
          >
            <ThemedText style={[styles.segButtonText, peakStyle === 'snap' && styles.segButtonTextSelected]}>
              Snap
            </ThemedText>
          </Pressable>
        </View>

        {peakStyle === 'snap' && (
          <>
            <View style={styles.divider} />
            <ThemedText style={styles.tuningLabel}>Snap Frequency</ThemedText>
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderLabel}>2 Hz</ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={snapDensity}
                onValueChange={setSnapDensity}
                minimumTrackTintColor={Colors.light.accent}
                maximumTrackTintColor={Colors.light.border}
                thumbTintColor={Colors.light.accent}
                testID="slider-wizard-snap"
              />
              <ThemedText style={styles.sliderLabel}>8 Hz</ThemedText>
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.testButton, pressed && styles.testButtonPressed]}
          onPress={handleTestCurrent}
          testID="button-test-current"
        >
          <Feather name="zap" size={18} color={Colors.light.primary} />
          <ThemedText style={styles.testButtonText}>Test Current Settings</ThemedText>
        </Pressable>
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
          <ThemedText style={styles.summaryLabel}>Peak Style</ThemedText>
          <ThemedText style={styles.summaryValue}>{peakStyle === 'max' ? 'Max' : 'Snap'}</ThemedText>
        </View>
        {peakStyle === 'snap' && (
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Snap Frequency</ThemedText>
            <ThemedText style={styles.summaryValue}>{Math.round(2 + snapDensity * 6)} Hz</ThemedText>
          </View>
        )}
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
      case 'trial-abc': return renderTrialABC();
      case 'fine-tune': return renderFineTune();
      case 'audio': return renderAudioStep();
      case 'complete': return renderComplete();
    }
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = ['site-select', 'trial-abc', 'fine-tune', 'audio', 'complete'];
    return steps.indexOf(step) + 1;
  };

  const canProceed = () => {
    if (step === 'site-select') return !!selectedSite;
    if (step === 'trial-abc') return !!selectedTrial;
    return true;
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
          {[1, 2, 3, 4, 5].map((num) => (
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
                  disabled={!canProceed()}
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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  trialsContainer: {
    gap: Spacing.md,
  },
  trialCard: {
    borderWidth: 2,
    borderColor: "transparent",
  },
  trialCardSelected: {
    borderColor: Colors.light.primary,
  },
  trialContent: {
    padding: Spacing.md,
  },
  trialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  trialBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  trialBadgeSelected: {
    backgroundColor: Colors.light.primary,
  },
  trialBadgeText: {
    ...Typography.button,
    color: Colors.light.text,
    fontSize: 14,
  },
  trialBadgeTextSelected: {
    color: Colors.light.buttonText,
  },
  trialLabel: {
    ...Typography.button,
    color: Colors.light.text,
    flex: 1,
  },
  trialDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  tryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.primary + "15",
    gap: Spacing.xs,
  },
  tryButtonPressed: {
    opacity: 0.7,
  },
  tryButtonText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  tuningCard: {
    padding: Spacing.xl,
  },
  tuningLabel: {
    ...Typography.button,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
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
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.lg,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  segButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  segButtonSelected: {
    backgroundColor: Colors.light.primary,
  },
  segButtonPressed: {
    opacity: 0.85,
  },
  segButtonText: {
    ...Typography.button,
    color: Colors.light.text,
  },
  segButtonTextSelected: {
    color: Colors.light.buttonText,
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
