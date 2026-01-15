# Alivio Ease

## Overview

Alivio Ease is a React Native/Expo wellness companion app designed to provide calming sensory distraction during routine self-care moments. The app uses gentle haptic vibration patterns, soothing audio, and visual focus techniques featuring "Ali the dragonfly" as a focal point. This is explicitly a wellness tool, not a medical device - the design intentionally avoids clinical/medical aesthetics in favor of soft, organic, calming visuals.

Key features include:
- Customizable haptic vibration patterns (Standard, Gentle Wave, Soft Pulse)
- Session site selection (7 body sites: arms, thighs, abdomen, other)
- Configurable session durations (18s, 24s, 30s) with phase-based timing (settle/peak/cool)
- Session timer with visual dragonfly animation for focus
- Post-session comfort rating system (1-5 scale)
- Session history tracking with site information
- Per-site tuning via Discovery Wizard with A/B/C trials (Gentle/Balanced/Strong presets) and fine-tuning
- User preferences for haptic intensity, audio volume, peak style (max/snap), snap density
- Debug mode for session diagnostics
- Age verification with parental consent flow for users under 18
- Mandatory disclaimer acceptance during onboarding

## User Preferences

Preferred communication style: Simple, everyday language.

## Running the App

### Web Development (Default Workflow)
The default "Start application" workflow runs `npm run dev` which starts both:
- Express backend on port 5000
- Metro bundler on port 8081 (localhost mode for web)

### Mobile Device Testing (Expo Go)
For testing on physical iOS/Android devices via Expo Go, run Metro in tunnel mode:

1. **Stop the default workflow** (to avoid port conflicts)
2. **In the Shell, run:**
   ```bash
   npx expo start --tunnel --clear
   ```
3. **Wait for tunnel to connect** - you'll see a URL like `exp://xxxxx-anonymous-8081.exp.direct`
4. **Open Expo Go on your device** and enter the tunnel URL manually, or scan the QR code

**Important:** 
- Do NOT use `EXPO_PACKAGER_PROXY_URL`, `REACT_NATIVE_PACKAGER_HOSTNAME`, or `EXPO_PUBLIC_DOMAIN` env vars for tunnel mode
- Metro serves bundles directly via tunnel (not through the Express backend)
- The backend is not required for mobile testing - it only provides the landing page and future API endpoints

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54, TypeScript enabled throughout.

**Navigation Structure**: 
- Root navigation uses React Navigation with a native stack
- Tab navigation (4 tabs: Home, History, Settings, Profile) for main app
- Separate onboarding stack navigator shown only for new users
- Modal screens for active sessions and comfort ratings

**State Management**:
- React Context (`AppContext`) for global app state (onboarding, preferences, sessions)
- TanStack React Query configured but primarily for future API integration
- AsyncStorage for local persistence of all user data

**Key Design Patterns**:
- Path aliases configured: `@/` maps to `./client`, `@shared/` maps to `./shared`
- Themed components (`ThemedText`, `ThemedView`) for consistent light/dark mode support
- Custom hooks for screen options, theme access, and session audio
- Reanimated for smooth animations, expo-haptics for vibration feedback

**Directory Structure**:
```
client/
├── components/     # Reusable UI components
├── constants/      # Theme, disclaimers, static data
├── context/        # React Context providers
├── hooks/          # Custom React hooks
├── navigation/     # Navigation configuration
├── screens/        # Screen components
├── services/       # Business logic (HapticsService, StorageService)
└── types/          # TypeScript type definitions
```

### Backend Architecture

**Server**: Express.js with TypeScript, minimal API surface currently.

**Database**: PostgreSQL with Drizzle ORM configured. Schema currently contains only a users table - session data is stored client-side in AsyncStorage.

**API Pattern**: RESTful endpoints prefixed with `/api`. Query client configured for data fetching but not heavily used yet - app is primarily client-side.

### Data Storage

**Client-side**: AsyncStorage stores:
- Session history (array of session logs with ratings, site info)
- User preferences (haptic intensity, audio volume, display name, avatar, peak style, snap density, debug mode, site tunings)
- Site-specific tunings (per-site haptic/audio configurations)
- Onboarding state (disclaimer acceptance, age, parental consent, discovery completed)

**Server-side**: PostgreSQL database available but not yet used for core features. In-memory storage implemented as fallback.

### Authentication

No authentication system implemented. The app is designed for single-user local use.

## External Dependencies

### Third-Party Services
- No external APIs currently integrated
- Audio files loaded from freesound.org URLs for session sounds

### Key Expo Modules
- `expo-haptics`: Core haptic feedback for sensory distraction
- `expo-av` / `expo-audio`: Audio playback for session sounds
- `expo-keep-awake`: Prevents screen sleep during sessions
- `expo-linear-gradient`: Visual gradient effects
- `expo-blur`: iOS tab bar blur effects

### Database
- PostgreSQL via Drizzle ORM (connection via `DATABASE_URL` environment variable)
- Drizzle Kit for migrations (output to `./migrations`)

### Storage
- `@react-native-async-storage/async-storage`: Local persistence for all user data

### UI/Navigation
- `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- `react-native-reanimated`: Animation library
- `react-native-safe-area-context`: Safe area handling
- `@react-native-community/slider`: Haptic intensity slider