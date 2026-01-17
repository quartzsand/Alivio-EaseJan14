// App.tsx - Fix the import paths
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

// CORRECTED IMPORTS - Remove the extra "client/" layer
import SessionScreen from "./client/screens/SessionScreen";
import HomeScreen from "./client/screens/HomeScreen";
import SettingsScreen from "./client/screens/SettingsScreen";
import SiteSelectionScreen from "./client/screens/SiteSelectionScreen";
// App.tsx - Fix the import paths
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// CORRECTED IMPORTS - Remove the extra "client/" layer
import SessionScreen from './client/screens/SessionScreen';
import HomeScreen from './client/screens/HomeScreen'; 
import SettingsScreen from './client/screens/SettingsScreen';
import SiteSelectionScreen from './client/screens/SiteSelectionScreen';