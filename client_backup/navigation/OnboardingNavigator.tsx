import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "@/screens/onboarding/WelcomeScreen";
import DisclaimerScreen from "@/screens/onboarding/DisclaimerScreen";
import AgeVerificationScreen from "@/screens/onboarding/AgeVerificationScreen";
import ParentalConsentScreen from "@/screens/onboarding/ParentalConsentScreen";
import PreferencesScreen from "@/screens/onboarding/PreferencesScreen";
import { useApp } from "@/context/AppContext";

export type OnboardingStackParamList = {
  Welcome: undefined;
  Disclaimer: undefined;
  AgeVerification: undefined;
  ParentalConsent: undefined;
  Preferences: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

function getInitialRoute(onboarding: { 
  disclaimerAccepted: boolean; 
  age: number | null; 
  parentalConsentGiven: boolean;
  completed: boolean;
}): keyof OnboardingStackParamList {
  if (!onboarding.disclaimerAccepted) {
    return "Welcome";
  }
  if (onboarding.age === null) {
    return "AgeVerification";
  }
  if (onboarding.age < 18 && !onboarding.parentalConsentGiven) {
    return "ParentalConsent";
  }
  return "Preferences";
}

export default function OnboardingNavigator() {
  const { onboarding } = useApp();
  const initialRoute = getInitialRoute(onboarding);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
      <Stack.Screen name="AgeVerification" component={AgeVerificationScreen} />
      <Stack.Screen name="ParentalConsent" component={ParentalConsentScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
    </Stack.Navigator>
  );
}
