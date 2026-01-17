// App.tsx - COMPLETE FILE WITH PROPER NAVIGATION
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

// Import screens using the correct paths
import HomeScreen from "./client/screens/HomeScreen";
import SessionScreen from "./client/screens/SessionScreen";
import SettingsScreen from "./client/screens/SettingsScreen";

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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
