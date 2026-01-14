# Alivio Ease Design Guidelines

## Brand Identity

**Purpose**: Alivio Ease provides calming sensory distraction during routine self-care moments, using gentle haptics, soothing audio, and visual focus techniques.

**Aesthetic Direction**: **Soft/organic with intentional calm** - Think breathing room, gentle curves, and purposeful stillness. This is a safe space, not a clinical tool. The app should feel like a supportive companion - warm, trustworthy, and reassuring without being childish.

**Memorable Element**: Ali the dragonfly - a minimalist, friendly character that appears during sessions as a focal point for visual distraction. Ali is subtle and tasteful, not cartoonish.

**Critical Design Principle**: NEVER use medical aesthetics (clinical blue-white, sterile UI, medical icons). This is a wellness companion, not a health app.

## Navigation Architecture

**Root Navigation**: Tab Navigation (4 tabs) with floating action button for core "Start Session" action.

**Tab Structure**:
1. **Home** - Session launcher and quick stats
2. **History** - Past session log with comfort ratings
3. **Settings** - Preferences and disclaimers
4. **Profile** - User info (name, avatar, age verification status)

**Modals** (presented outside tab navigation):
- Onboarding flow (first launch only)
- Active session screen (full-screen immersive)
- Post-session comfort rating
- Parental consent (age < 18)

## Screen-by-Screen Specifications

### Onboarding Flow (Stack-only, shown once)
**Welcome Screen**:
- Hero illustration showing Ali the dragonfly in peaceful setting
- App name and tagline: "Your companion for calm moments"
- Continue button

**Disclaimer Screen (mandatory)**:
- Header: "Important Information" (centered, cannot dismiss)
- Scrollable content area with full disclaimer text
- Checkbox: "I understand this is a wellness tool, not medical advice"
- Continue button (disabled until checkbox checked)
- Safe area: top = insets.top + 24, bottom = insets.bottom + 24

**Age Verification Screen**:
- Question: "What's your age?"
- Number input (large, centered)
- If < 18: Navigate to Parental Consent
- If ≥ 18: Navigate to Preferences

**Parental Consent Screen** (if under 18):
- Header: "Parental Permission Required"
- Explanation text
- "Get Parent/Guardian to Continue" button
- Secondary consent checkbox for parent
- Safe area: top = insets.top + 24, bottom = insets.bottom + 24

**Preferences Screen**:
- Header: "Personalize Your Experience"
- Form with:
  - Display name input
  - Haptic intensity slider (Gentle → Strong)
  - Audio toggle
- Complete Onboarding button
- Safe area: bottom = insets.bottom + 24

---

### Home Tab (Default Landing)
- **Header**: Transparent, no title, Settings icon (top-right)
- **Content** (scrollable):
  - Greeting: "Hi [Name], ready for calm?"
  - Quick stats card: "Sessions this week: X" (subtle, not prominent)
  - Helpful tip card (rotating wellness tips, dismissible)
- **Floating Action Button**: Large circular button with "Start Session" centered on screen, elevated above content
  - Position: bottom center, 80pt above tab bar
  - Shadow: width 0, height 4, opacity 0.15, radius 8
  - Icon: Play icon or Ali silhouette
- **Safe area**: top = insets.top + 24, bottom = tabBarHeight + 80 + 24

---

### Active Session Screen (Full-screen modal)
- **Header**: Transparent, close button (top-left with confirmation alert)
- **Layout**: Centered, non-scrollable
  - Large circular timer display (MM:SS format, countdown)
  - Ali dragonfly animation below timer (Lottie, looping gently)
  - Current haptic pattern name (subtle text, below animation)
  - Haptic pattern selector (3 pill-shaped buttons: Standard, Wave, Pulse)
- **Footer**: End Session button (bottom, full-width)
- **Safe area**: top = insets.top + 48, bottom = insets.bottom + 24
- **Background**: Subtle gradient (calming, not distracting)

---

### Post-Session Comfort Rating (Modal)
- **Header**: "How do you feel?" (centered, no dismiss button)
- **Content** (non-scrollable, centered):
  - 5-point comfort scale (emoji-free):
    - Very Uncomfortable
    - Uncomfortable  
    - Neutral
    - Comfortable
    - Very Comfortable
  - Large tappable buttons in vertical stack
  - Optional notes field (collapsed by default, "Add notes" expands)
- **Submit**: "Save & Close" button at bottom
- **Safe area**: top = insets.top + 48, bottom = insets.bottom + 24

---

### History Tab
- **Header**: Default navigation header, "History" title (centered), filter icon (top-right)
- **Content**: 
  - If empty: Empty state illustration (person relaxing with dragonfly) + "No sessions yet" message
  - If populated: List of session cards, most recent first
    - Each card shows: Date/time, duration, comfort rating, haptic pattern used
    - Tap to expand for notes (if any)
- **Safe area**: top = 0 (default header), bottom = tabBarHeight + 24

---

### Settings Tab
- **Header**: Default navigation header, "Settings" title (centered)
- **Content**: Scrollable form
  - **Preferences Section**:
    - Haptic intensity slider
    - Audio toggle
    - Theme (Light/Dark/Auto)
  - **Information Section**:
    - About Alivio Ease (navigates to modal)
    - View Disclaimer (navigates to scrollable disclaimer modal)
    - Contact Support (email link)
  - **Account Section** (nested):
    - Clear History (with confirmation)
    - Reset App (with double confirmation)
- **Safe area**: top = 0, bottom = tabBarHeight + 24

---

### Profile Tab
- **Header**: Default navigation header, "Profile" title (centered)
- **Content**: Scrollable
  - User avatar (tappable, shows 4 preset options: abstract dragonfly patterns)
  - Display name (editable field)
  - Age verification status badge (if under 18, shows "Guardian Verified")
  - Sessions completed count (achievement-style stat)
- **Safe area**: top = 0, bottom = tabBarHeight + 24

---

## Color Palette

**Primary**: #6B9AC4 (Soft sky blue - calming, non-medical)
**Accent**: #A8D5BA (Mint green - for success states, Ali's wings)
**Background**: #F7F9FC (Warm off-white, not stark)
**Surface**: #FFFFFF (Pure white for cards)
**Text Primary**: #2C3E50 (Soft charcoal, not pure black)
**Text Secondary**: #7C8B9C (Muted gray)
**Border**: #E4E9F0 (Barely-there dividers)
**Success**: #A8D5BA (Mint, matches accent)
**Warning**: #F5CCA0 (Soft peach, for disclaimers)

## Typography

**Font**: Nunito (Google Font) - friendly, rounded, legible at small sizes
- **Headline**: Nunito Bold, 28pt
- **Title**: Nunito SemiBold, 20pt  
- **Body**: Nunito Regular, 16pt
- **Caption**: Nunito Regular, 14pt
- **Button**: Nunito SemiBold, 16pt

## Visual Design
- Touchable feedback: Reduce opacity to 0.7 on press
- Buttons: 16pt corner radius (soft, not overly rounded)
- Cards: 12pt corner radius, subtle shadow (offset 0/2, opacity 0.08, radius 4)
- Use Feather icons for navigation and actions
- NO medical icons (syringes, pills, bandages)

## Assets to Generate

**Required**:
1. **icon.png** - App icon: Ali dragonfly silhouette in Primary color on Accent background (512x512)
2. **splash-icon.png** - Ali dragonfly with subtle glow (400x400, centered on Primary background)
3. **onboarding-hero.png** - Ali resting on soft cloud/leaf, pastel colors (WHERE USED: Welcome screen)
4. **empty-history.png** - Person meditating with Ali nearby (WHERE USED: History tab empty state)
5. **ali-dragonfly-animation.json** - Lottie file: Ali gently flapping wings, looping (WHERE USED: Active session screen)

**User Avatars** (generate 4 presets):
6. **avatar-dragonfly-blue.png** - Abstract dragonfly pattern, blue tones
7. **avatar-dragonfly-green.png** - Abstract dragonfly pattern, green tones
8. **avatar-dragonfly-purple.png** - Abstract dragonfly pattern, purple tones
9. **avatar-dragonfly-pink.png** - Abstract dragonfly pattern, pink tones

**Audio** (placeholder names, generate calming tones):
10. **session-start.mp3** - Gentle chime (WHERE USED: Session begins)
11. **session-complete.mp3** - Warm success tone (WHERE USED: Session ends successfully)