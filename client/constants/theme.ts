import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#6B9AC4",
    accent: "#A8D5BA",
    background: "#F7F9FC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    text: "#2C3E50",
    textSecondary: "#7C8B9C",
    border: "#E4E9F0",
    success: "#A8D5BA",
    warning: "#F5CCA0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#7C8B9C",
    tabIconSelected: "#6B9AC4",
    link: "#6B9AC4",
    backgroundRoot: "#F7F9FC",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#E4E9F0",
    backgroundTertiary: "#D9E2EC",
  },
  dark: {
    primary: "#7BADD4",
    accent: "#B8E5CA",
    background: "#1A2634",
    surface: "#243447",
    text: "#E8EDF2",
    textSecondary: "#9AA8B8",
    border: "#3A4A5A",
    success: "#B8E5CA",
    warning: "#F5CCA0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9AA8B8",
    tabIconSelected: "#7BADD4",
    link: "#7BADD4",
    backgroundRoot: "#1A2634",
    backgroundDefault: "#243447",
    backgroundSecondary: "#3A4A5A",
    backgroundTertiary: "#4A5A6A",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontFamily: "Nunito_400Regular",
  },
};

export const Shadows = {
  card: {
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Nunito_400Regular",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "Nunito_400Regular",
    serif: "serif",
    rounded: "Nunito_400Regular",
    mono: "monospace",
  },
  web: {
    sans: "Nunito, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "Nunito, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
