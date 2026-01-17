// App.tsx - ROOT LEVEL ENTRY POINT FOR ALIVIO'S EASEL
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

// Import screens from client/screens directory
import HomeScreen from "./client/screens/HomeScreen";
import SessionScreen from "./client/screens/SessionScreen";
import SettingsScreen from "./client/screens/SettingsScreen";
import SiteSelectionScreen from "./client/screens/SiteSelectionScreen";
import HistoryScreen from "./client/screens/HistoryScreen";
import ProfileScreen from "./client/screens/ProfileScreen";
import AboutScreen from "./client/screens/AboutScreen";
import ComfortRatingScreen from "./client/screens/ComfortRatingScreen";
import DiscoveryWizardScreen from "./client/screens/DiscoveryWizardScreen";
import DisclaimerModalScreen from "./client/screens/DisclaimerModalScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          {/* Main App Screens */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: "Alivio's Easel",
            }}
          />

          <Stack.Screen
            name="Session"
            component={SessionScreen}
            options={{
              gestureEnabled: false, // Prevent accidental dismissal during session
              title: "Comfort Session",
            }}
          />

          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: "Settings",
            }}
          />

          {/* Additional Screens */}
          <Stack.Screen
            name="SiteSelection"
            component={SiteSelectionScreen}
            options={{
              title: "Select Injection Site",
            }}
          />

          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: "Session History",
            }}
          />

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: "Profile",
            }}
          />

          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{
              title: "About Alivio's Easel",
            }}
          />

          <Stack.Screen
            name="ComfortRating"
            component={ComfortRatingScreen}
            options={{
              title: "Rate Your Experience",
            }}
          />

          <Stack.Screen
            name="DiscoveryWizard"
            component={DiscoveryWizardScreen}
            options={{
              title: "Setup Wizard",
            }}
          />

          {/* Modal Screens */}
          <Stack.Screen
            name="DisclaimerModal"
            component={DisclaimerModalScreen}
            options={{
              presentation: "modal",
              title: "Important Information",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
