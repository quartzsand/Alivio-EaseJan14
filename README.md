# Alivio Ease - Wellness & Relaxation Tool

**Alivio Ease** is a mobile wellness application that provides sensory distraction (haptic vibration and calming audio) to support comfort and relaxation during routine self-care activities like self-injections.

## ⚠️ Important Disclaimer

**Alivio Ease is NOT a medical device.** It does not diagnose, treat, cure, or prevent any medical condition. This is a wellness tool designed to support comfort through sensory distraction. Always follow your healthcare provider's instructions.

## 🎯 Features

- **Sensory Sessions**: User-configurable haptic patterns for comfort
- **Comfort Tracking**: Log your comfort level over time (personal wellness data)
- **Streak System**: Build consistency in your self-care routine
- **Wellness Language**: Focused on ease, comfort, and confidence (not medical claims)
- **Privacy First**: All data stored locally on your device

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Key Libraries**:
  - `expo-haptics`: Precise vibration control
  - `expo-av`: Audio feedback
  - `@react-native-async-storage/async-storage`: Local data storage
  - `@react-navigation/native`: Screen navigation

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Expo Go app on iOS device
- WiFi connection

### Installation

1. Clone this repository:
```bash
git clone https://github.com/YOUR-USERNAME/alivio-ease.git
cd alivio-ease
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Scan QR code with Expo Go app

## 📱 Testing on iOS

1. Install **Expo Go** from App Store
2. Ensure device and computer are on same WiFi
3. Scan QR code from terminal
4. App will load in 10-30 seconds

**Note:** Haptic vibration only works on physical device, not in browser preview.

## 🏗️ Project Structure
```
src/
├── components/     # Reusable UI components (future)
├── screens/        # Main app screens
│   ├── DisclaimerScreen.tsx
│   ├── SessionScreen.tsx
│   ├── ComfortRatingScreen.tsx
│   └── SettingsScreen.tsx
├── services/       # Business logic
│   ├── SensoryEngine.ts    # Haptic control
│   └── StorageService.ts   # Data persistence
├── constants/      # App-wide constants
│   ├── Colors.ts
│   └── DisclaimerText.ts
├── assets/         # Images, sounds, animations
└── types.ts        # TypeScript interfaces
```

## 📊 Data Tracking

Users can log:
- **Comfort Rating** (1-10): How comfortable they felt
- **Session Pattern**: Which haptic pattern they used
- **Routine Type**: Type of self-care activity
- **Streaks**: Consecutive days of sessions

All data is stored locally using AsyncStorage. No cloud sync, no tracking.

## 🎨 Design Philosophy

**Wellness-Focused Language:**
- ✅ "Comfort," "ease," "calmness," "confidence"
- ✅ "Sensory distraction," "relaxation support"
- ❌ NO medical claims ("pain relief," "analgesia," "treatment")

**User Empowerment:**
- All vibration patterns are user preferences
- Placement guidance is suggested, not prescribed
- Parameters displayed for transparency, not as therapy

## ⚖️ Legal & Regulatory

- **Not a Medical Device**: Compliant with FDA non-device software guidance
- **Class I Exempt**: Positioned as general wellness product
- **Disclaimers**: Prominent disclaimers on launch and in Settings
- **No Medical Claims**: Carefully avoids therapeutic language

## 🤝 Contributing

This is a personal wellness project. If you'd like to contribute or have suggestions, please open an issue.

## 📄 License

MIT License - See LICENSE file for details

## 👨‍⚕️ About

Developed by board-certified Emergency Medicine physicians. While created by medical professionals, this wellness tool does not provide medical advice and is not intended to replace professional healthcare guidance.

---

**For Medical Emergencies:** Call 911 or your local emergency number immediately. This app is not for emergency use.