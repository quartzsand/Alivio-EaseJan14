import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, BackHandler } from 'react-native';
import { DISCLAIMERS } from '../constants/DisclaimerText';
import { COLORS } from '../constants/Colors';
import StorageService from '../services/StorageService';

export default function DisclaimerScreen({ navigation }: any) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleAccept = async () => {
    await StorageService.acceptDisclaimer();
    navigation.replace('Session');
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isBottom = layoutMeasurement.height + contentOffset.y >= 
                      contentSize.height - paddingToBottom;

    if (isBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Exit App',
      'You must accept the disclaimer to use Alivio Ease.',
      [
        { text: 'Review Again', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Before You Begin</Text>
      <Text style={styles.subtitle}>Please read this important information</Text>

      <ScrollView 
        style={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <Text style={styles.disclaimerText}>{DISCLAIMERS.MASTER}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This App Does:</Text>
          <Text style={styles.sectionText}>
            • Provides sensory distraction (vibration and audio){'\n'}
            • Helps track your comfort and routine adherence{'\n'}
            • Supports relaxation during self-care activities{'\n'}
            • Offers user-configurable preferences
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This App Does NOT Do:</Text>
          <Text style={styles.sectionText}>
            • Diagnose, treat, cure, or prevent any medical condition{'\n'}
            • Provide medical advice or instructions{'\n'}
            • Replace guidance from your healthcare provider{'\n'}
            • Guarantee any specific health outcomes
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Responsibilities:</Text>
          <Text style={styles.sectionText}>
            • Always follow your healthcare provider's instructions{'\n'}
            • Consult a clinician with any medical questions{'\n'}
            • Do not rely on this app for medical decisions{'\n'}
            • Use this wellness tool at your own discretion
          </Text>
        </View>

        <Text style={styles.scrollPrompt}>
          {hasScrolledToBottom ? '✓ You've read the full disclaimer' : '↓ Scroll to continue'}
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={[styles.acceptButton, !hasScrolledToBottom && styles.acceptButtonDisabled]}
        onPress={handleAccept}
        disabled={!hasScrolledToBottom}
      >
        <Text style={styles.acceptButtonText}>I Understand - Continue to App</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
        <Text style={styles.declineButtonText}>Decline</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 10,
    color: COLORS.DARK_GRAY,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.SOFT_GRAY,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 20,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.DARK_GRAY,
  },
  section: {
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.MEDICAL_BLUE,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.DARK_GRAY,
  },
  scrollPrompt: {
    fontSize: 12,
    color: COLORS.SOFT_GRAY,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  acceptButton: {
    backgroundColor: COLORS.MEDICAL_BLUE,
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: COLORS.SOFT_GRAY,
    opacity: 0.5,
  },
  acceptButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  declineButton: {
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  declineButtonText: {
    color: COLORS.SOFT_GRAY,
    fontSize: 14,
  },
});