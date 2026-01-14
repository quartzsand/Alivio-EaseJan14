import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import SessionScreen from "@/screens/SessionScreen";
import ComfortRatingScreen from "@/screens/ComfortRatingScreen";
import DisclaimerModalScreen from "@/screens/DisclaimerModalScreen";
import AboutScreen from "@/screens/AboutScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/theme";
import type { HapticPattern } from "@/types";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Session: undefined;
  ComfortRating: { duration: number; hapticPattern: HapticPattern };
  DisclaimerModal: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isLoading, onboarding } = useApp();

  const isOnboardingComplete = onboarding.completed && 
    onboarding.disclaimerAccepted && 
    (onboarding.age === null || onboarding.age >= 18 || onboarding.parentalConsentGiven);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isOnboardingComplete ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Session"
            component={SessionScreen}
            options={{
              presentation: "fullScreenModal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ComfortRating"
            component={ComfortRatingScreen}
            options={{
              presentation: "modal",
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="DisclaimerModal"
            component={DisclaimerModalScreen}
            options={{
              presentation: "modal",
              headerTitle: "Disclaimer",
            }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{
              presentation: "modal",
              headerTitle: "About Alivio Ease",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
});
