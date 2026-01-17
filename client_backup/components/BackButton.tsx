import React from "react";
import { Pressable, Platform } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/theme";

interface BackButtonProps {
  onPress?: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  const navigation = useNavigation();

  const handlePress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        padding: 8,
      })}
      testID="back-button"
    >
      <AntDesign name="left" size={24} color={Colors.light.text} />
    </Pressable>
  );
}
