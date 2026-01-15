#!/usr/bin/env python3
"""
Alivios Easel - Sensory Profile Generator (Fixed for Replit/Expo Go)
Generates regulatory-safe sensory wellness audio with iPhone optimization
"""

import numpy as np
from scipy.io import wavfile
from scipy import signal
import os
from pathlib import Path

# =============================================================================
# CONFIGURATION (Fixed for our environment)
# =============================================================================

SAMPLE_RATE = 48000  # ✅ Fixed: Match Lyria output
OUTPUT_DIR = "assets/audio/sensory-tracks"  # ✅ Fixed: Match our structure
TEST_OUTPUT_DIR = "assets/audio/test-profiles"  # ✅ Added: Test profile directory

# =============================================================================
# REGULATORY-SAFE SENSORY PROFILES (Fixed naming)
# =============================================================================

WELLNESS_PROFILES = {
    "edge": {
        "display_name": "Edge",
        "description": "A crisp, focused sensation that many people prefer for small or sensitive areas.",
        "physics": "bone_sweep", 
        "freq_range": (200, 260),
        "chassis_freq": 180,  # ✅ Added: iPhone LRA optimization
        "durations": [18, 24, 30]  # ✅ Fixed: Multiple durations
    },
    "buffer": {
        "display_name": "Buffer", 
        "description": "A shield with positive vibes, often preferred for larger surface areas.",
        "physics": "dermal_sawtooth",
        "freq_range": (140, 180),
        "chassis_freq": 170,
        "durations": [18, 24, 30]
    },
    "deepwave": {
        "display_name": "Deep Wave",
        "description": "Designed to help when you want vibes that feel like they go deeper.",
        "physics": "phantom_percussion", 
        "carrier_freq": 180,  # ✅ Fixed: iPhone resonant frequency
        "pulse_rate": 2.5,    # ✅ Fixed: 150 BPM = 2.5 Hz (was too high)
        "chassis_freq": 150,
        "durations": [18, 24, 30]
    },
    "rhythmiclayers": {
        "display_name": "Rhythmic Layers",
        "description": "If you're unsure, start with Rhythmic Layers and adjust from there.",
        "physics": "am_modulation",
        "carrier_freq": 200,
        "modulation_freq": 8,  # ✅ Fixed: 8Hz theta waves (was 40Hz)
        "chassis_freq": 165,
        "durations": [18, 24, 30]
    }
}

# Texture variations for each profile
TEXTURE_VARIATIONS = {
    "constantflow": {
        "display_name": "Constant Flow",
        "modulation": "steady"
    },
    "rhythmicwaves": {
        "display_name": "Rhythmic Waves", 
        "modulation": "pulsed",
        "pulse_bpm": 100
    },
    "adaptiveflow": {
        "display_name": "Adaptive Flow",
        "modulation": "sweeping", 
        "sweep_period": 4.0
    }
}

# Test profiles (separate)
TEST_PROFILES = {
    "test-gate-control": {
        "display_name": "Test A: Sharp Pain Relief",
        "description": "Scientific baseline for sharp sensation masking (Gate Control Theory)",
        "physics": "steady_tone",
        "carrier_freq": 180,  # ✅ Fixed: iPhone optimal
        "chassis_freq": 170,
        "duration": 18
    },
    "test-massage-sim": {
        "display_name": "Test B: Deep Comfort", 
        "description": "Mimics therapeutic massage for general aches",
        "physics": "enhanced_pulses",
        "carrier_freq": 120,  # ✅ Fixed: Lowest meaningful iPhone freq
        "pulse_rate": 100,    # BPM
        "chassis_freq": 150,
        "duration": 30,
        "entrainment_ramp": 10  # ✅ Added: 10s ramp
    }
}

# =============================================================================
# SAFETY ENVELOPE SYSTEM (iPhone-optimized)
# =============================================================================

def generate_safety_envelope(duration: float, ramp_up: float = 3.0, ramp_down: float = 3.0) -> np.ndarray:
    """Generate safety envelope to prevent acoustic startle reflex"""
    total_samples = int(duration * SAMPLE_RATE)
    envelope = np.ones(total_samples)

    # Gentle ramp up (prevents startle)
    up_samples = int(ramp_up * SAMPLE_RATE)
    if up_samples > 0 and up_samples < total_samples:
        envelope[:up_samples] = np.linspace(0, 1, up_samples)

    # Gentle ramp down (smooth completion)
    down_samples = int(ramp_down * SAMPLE_RATE)
    if down_samples > 0 and down_samples < total_samples:
        envelope[-down_samples:] = np.linspace(1, 0, down_samples)

    return envelope

# =============================================================================
# IPHONE CHASSIS COUPLING LAYER
# =============================================================================

def generate_chassis_coupling(profile_name: str, duration: float) -> np.ndarray:
    """Generate optimized chassis vibration for iPhone speakers"""

    if profile_name in WELLNESS_PROFILES:
        chassis_freq = WELLNESS_PROFILES[profile_name]["chassis_freq"]
    else:
        chassis_freq = 160  # Default

    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))

    # Primary chassis frequency (optimized for iPhone speaker coupling)
    chassis_wave = 0.4 * np.sin(2 * np.pi * chassis_freq * t)

    # Secondary coupling frequency (sub-bass simulation)
    sub_bass_freq = 75  # ✅ Fixed: Higher than 65Hz for better iPhone response
    sub_bass_wave = 0.3 * np.sin(2 * np.pi * sub_bass_freq * t)

    return chassis_wave + sub_bass_wave

# =============================================================================
# SENSORY FREQUENCY GENERATION
# =============================================================================

def generate_sensory_layer(profile_name: str, texture: str, duration: float) -> np.ndarray:
    """Generate sensory comfort frequencies with texture variation"""

    profile = WELLNESS_PROFILES[profile_name]
    texture_info = TEXTURE_VARIATIONS[texture]

    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    physics_type = profile["physics"]

    # Generate base sensory waveform
    if physics_type == "bone_sweep":
        # Edge: Crisp frequency sweep for bone conduction
        start_freq, end_freq = profile["freq_range"]

        if texture_info["modulation"] == "steady":
            freq = (start_freq + end_freq) / 2
            wave = np.sin(2 * np.pi * freq * t)
        elif texture_info["modulation"] == "pulsed":
            freq = (start_freq + end_freq) / 2
            carrier = np.sin(2 * np.pi * freq * t)
            pulse_freq = texture_info["pulse_bpm"] / 60
            gate = (signal.square(2 * np.pi * pulse_freq * t, duty=0.6) + 1) / 2
            wave = carrier * gate
        else:  # sweeping
            sweep_period = texture_info["sweep_period"]
            lfo = (signal.sawtooth(2 * np.pi * (1/sweep_period) * t, width=0.5) + 1) / 2
            freq_instant = start_freq + (end_freq - start_freq) * lfo
            phase = 2 * np.pi * np.cumsum(freq_instant) / SAMPLE_RATE
            wave = np.sin(phase)

    elif physics_type == "dermal_sawtooth":
        # Buffer: Sawtooth wave for protective sensation
        start_freq, end_freq = profile["freq_range"]

        if texture_info["modulation"] == "steady":
            freq = (start_freq + end_freq) / 2
            wave = signal.sawtooth(2 * np.pi * freq * t)
        elif texture_info["modulation"] == "pulsed":
            freq = (start_freq + end_freq) / 2
            carrier = signal.sawtooth(2 * np.pi * freq * t)
            pulse_freq = texture_info["pulse_bpm"] / 60
            gate = (signal.square(2 * np.pi * pulse_freq * t, duty=0.6) + 1) / 2
            wave = carrier * gate
        else:  # sweeping
            sweep_period = texture_info["sweep_period"]
            lfo = (signal.sawtooth(2 * np.pi * (1/sweep_period) * t, width=0.5) + 1) / 2
            freq_instant = start_freq + (end_freq - start_freq) * lfo
            phase = 2 * np.pi * np.cumsum(freq_instant) / SAMPLE_RATE
            wave = signal.sawtooth(phase)

    elif physics_type == "phantom_percussion":
        # Deep Wave: Enhanced percussion simulation
        carrier = np.sin(2 * np.pi * profile["carrier_freq"] * t)

        # Enhanced pulse generation (saw^8 profile)
        pulse_freq = profile["pulse_rate"]
        saw_pulse = signal.sawtooth(2 * np.pi * pulse_freq * t, width=1.0)
        enhanced_envelope = ((saw_pulse + 1) / 2) ** 8  # Sharp pulses

        if texture_info["modulation"] == "pulsed":
            # Additional BPM gating
            bpm_freq = texture_info["pulse_bpm"] / 60
            bpm_gate = (signal.square(2 * np.pi * bpm_freq * t, duty=0.7) + 1) / 2
            enhanced_envelope *= bpm_gate

        wave = carrier * enhanced_envelope

    elif physics_type == "am_modulation":
        # Rhythmic Layers: Amplitude modulation
        carrier = np.sin(2 * np.pi * profile["carrier_freq"] * t)

        if texture_info["modulation"] == "steady":
            modulation_freq = profile["modulation_freq"]
            modulator = 0.5 * (1 + np.sin(2 * np.pi * modulation_freq * t))
        elif texture_info["modulation"] == "pulsed":
            # Pulsed AM
            pulse_freq = texture_info["pulse_bpm"] / 60
            base_mod = 0.5 * (1 + np.sin(2 * np.pi * profile["modulation_freq"] * t))
            pulse_gate = (signal.square(2 * np.pi * pulse_freq * t, duty=0.6) + 1) / 2
            modulator = base_mod * pulse_gate
        else:  # sweeping
            # Sweeping modulation frequency
            sweep_period = texture_info["sweep_period"]
            lfo = (signal.sawtooth(2 * np.pi * (1/sweep_period) * t, width=0.5) + 1) / 2
            mod_freq_instant = profile["modulation_freq"] * (0.5 + 0.5 * lfo)
            modulator = 0.5 * (1 + np.sin(2 * np.pi * mod_freq_instant * t))

        wave = carrier * modulator
    else:
        wave = np.zeros_like(t)

    return wave

# =============================================================================
# WELLNESS NOISE GENERATION (Lo-Fi Simulation)
# =============================================================================

def generate_wellness_noise(noise_type: str, length: int) -> np.ndarray:
    """Generate lo-fi wellness texture (placeholder for Lyria)"""

    if noise_type == "pink_noise":
        # Crystalline texture for Edge
        white = np.random.normal(0, 1, length)
        # Simple pink noise approximation
        b, a = signal.butter(1, 0.02, btype='low')
        pink = signal.lfilter(b, a, white)
        return pink * 0.3

    elif noise_type == "brown_noise":
        # Warm texture for Buffer  
        white = np.random.normal(0, 1, length)
        brown = np.cumsum(white)
        brown = brown / np.max(np.abs(brown))
        return brown * 0.25

    elif noise_type == "rhythmic_thud":
        # Deep rhythmic texture for Deep Wave
        white = np.random.normal(0, 1, length)
        # Low-pass filter for deep character
        b, a = signal.butter(2, 0.01, btype='low')
        deep_noise = signal.lfilter(b, a, white)
        return deep_noise * 0.3

    else:  # modulated_noise for Rhythmic Layers
        white = np.random.normal(0, 1, length)
        # Gentle modulated texture
        t = np.linspace(0, len(white)/SAMPLE_RATE, len(white))
        modulation = 0.5 * (1 + 0.3 * np.sin(2 * np.pi * 0.2 * t))  # Slow modulation
        return white * modulation * 0.2

# =============================================================================
# MAIN GENERATION FUNCTIONS
# =============================================================================

def generate_wellness_track(profile_name: str, texture: str, duration: float) -> np.ndarray:
    """Generate complete wellness audio track"""

    print(f"🧘 Generating: {profile_name}-{texture}-{duration}s")

    # Generate sensory layer
    sensory_layer = generate_sensory_layer(profile_name, texture, duration)

    # Generate chassis coupling
    chassis_layer = generate_chassis_coupling(profile_name, duration)

    # Generate wellness noise (lo-fi simulation)
    noise_type = "pink_noise"  # Could be customized per profile
    wellness_noise = generate_wellness_noise(noise_type, len(sensory_layer))

    # Mix layers
    # 50% Sensory frequencies (pain relief)
    # 30% Chassis coupling (tactile feedback)
    # 20% Wellness texture (relaxation)
    mixed_audio = (0.5 * sensory_layer + 
                   0.3 * chassis_layer + 
                   0.2 * wellness_noise)

    # Apply safety envelope
    safety_envelope = generate_safety_envelope(duration)
    final_audio = mixed_audio * safety_envelope

    # Normalize
    final_audio = final_audio / np.max(np.abs(final_audio)) * 0.85

    return final_audio

def generate_test_track(test_profile_id: str) -> np.ndarray:
    """Generate test validation profile"""

    profile = TEST_PROFILES[test_profile_id]
    duration = profile["duration"]

    print(f"🧪 Generating test: {profile['display_name']}")

    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))

    if profile["physics"] == "steady_tone":
        # Test A: Pure Gate Control Theory
        carrier_freq = profile["carrier_freq"]
        wave = np.sin(2 * np.pi * carrier_freq * t)

    elif profile["physics"] == "enhanced_pulses":
        # Test B: Massage gun simulation
        carrier_freq = profile["carrier_freq"]
        pulse_bpm = profile["pulse_rate"]

        # Enhanced saw^8 pulses
        carrier = np.sin(2 * np.pi * carrier_freq * t)
        pulse_freq = pulse_bpm / 60
        saw_wave = signal.sawtooth(2 * np.pi * pulse_freq * t, width=1.0)
        enhanced_envelope = ((saw_wave + 1) / 2) ** 8

        wave = carrier * enhanced_envelope

        # Entrainment ramp for sympathetic down-regulation
        if "entrainment_ramp" in profile:
            ramp_duration = profile["entrainment_ramp"]
            ramp_samples = int(ramp_duration * SAMPLE_RATE)
            if ramp_samples < len(wave):
                ramp = np.linspace(0.2, 1.0, ramp_samples)
                wave[:ramp_samples] *= ramp

    # Add chassis coupling
    chassis_freq = profile["chassis_freq"]
    chassis_component = 0.3 * np.sin(2 * np.pi * chassis_freq * t)

    mixed_test = 0.7 * wave + 0.3 * chassis_component

    # Apply safety envelope
    safety_envelope = generate_safety_envelope(duration)
    final_test = mixed_test * safety_envelope

    # Normalize
    final_test = final_test / np.max(np.abs(final_test)) * 0.85

    return final_test

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    """Generate all sensory profiles and test profiles"""

    print("🧠 Alivio Ease - Sensory Profile Generator (iPhone Optimized)")
    print("=" * 60)

    # Create output directories
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    Path(TEST_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

    generated_count = 0

    # Generate main wellness profiles
    print("\n📱 Generating Wellness Profiles...")
    for profile_name, profile_data in WELLNESS_PROFILES.items():
        for texture_name in TEXTURE_VARIATIONS.keys():
            for duration in profile_data["durations"]:

                # Generate audio
                audio_data = generate_wellness_track(profile_name, texture_name, duration)

                # Save with regulatory-safe naming
                filename = f"{profile_name}-{texture_name}-{duration}s.wav"
                filepath = Path(OUTPUT_DIR) / filename

                # Convert to 16-bit and save
                audio_int16 = (audio_data * 32767).astype(np.int16)
                wavfile.write(filepath, SAMPLE_RATE, audio_int16)

                print(f"✅ {filename}")
                generated_count += 1

    # Generate test profiles
    print("\n🧪 Generating Test Profiles...")
    for test_id, test_data in TEST_PROFILES.items():

        # Generate test audio
        audio_data = generate_test_track(test_id)

        # Save test file
        filename = f"{test_id}-{test_data['duration']}s.wav"
        filepath = Path(TEST_OUTPUT_DIR) / filename

        audio_int16 = (audio_data * 32767).astype(np.int16)
        wavfile.write(filepath, SAMPLE_RATE, audio_int16)

        print(f"✅ {filename}")
        generated_count += 1

    print(f"\n🎊 GENERATION COMPLETE!")
    print(f"   Generated: {generated_count} audio files")
    print(f"   Wellness: {OUTPUT_DIR}/")
    print(f"   Tests: {TEST_OUTPUT_DIR}/")

    print(f"\n📱 iPhone Testing:")
    print(f"   1. Copy files to Replit assets/audio/")
    print(f"   2. Set iPhone volume to maximum")
    print(f"   3. Press phone firmly against skin")
    print(f"   4. Test chassis vibration effectiveness")

if __name__ == "__main__":
    main()
```

---

## **📁 IMPLEMENTATION GUIDE**

### **Step 1: File Placement in Replit**
```
your-replit-project/
├── scripts/
│   └── generate_sensory_profiles.py    # ✅ Place the fixed script here
├── assets/
│   └── audio/
│       ├── sensory-tracks/             # ✅ Will be created by script
│       └── test-profiles/              # ✅ Will be created by script
└── src/
    └── services/
        └── SensoryAudioService.ts      # ✅ Needs modification (see below)

