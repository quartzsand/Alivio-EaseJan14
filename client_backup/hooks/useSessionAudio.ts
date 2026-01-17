import { useEffect, useCallback, useRef } from "react";
import { Audio } from "expo-av";
import { Platform } from "react-native";

const START = require("../../assets/audio/ui_start.mp3");
const COMPLETE = require("../../assets/audio/ui_complete.mp3");

export function useSessionAudio(enabled: boolean) {
  const startSoundRef = useRef<Audio.Sound | null>(null);
  const completeSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || !enabled) return;

    let mounted = true;

    const load = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound: s1 } = await Audio.Sound.createAsync(START, {
          shouldPlay: false,
          volume: 0.9,
        });
        const { sound: s2 } = await Audio.Sound.createAsync(COMPLETE, {
          shouldPlay: false,
          volume: 0.9,
        });

        if (!mounted) {
          await s1.unloadAsync();
          await s2.unloadAsync();
          return;
        }

        startSoundRef.current = s1;
        completeSoundRef.current = s2;
      } catch (e) {
        console.log("UI audio load error:", e);
      }
    };

    void load();

    return () => {
      mounted = false;
      void startSoundRef.current?.unloadAsync();
      void completeSoundRef.current?.unloadAsync();
      startSoundRef.current = null;
      completeSoundRef.current = null;
    };
  }, [enabled]);

  const playStartSound = useCallback(async () => {
    if (Platform.OS === "web" || !enabled) return;
    try {
      const s = startSoundRef.current;
      if (!s) return;
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch (e) {
      console.log("UI start sound error:", e);
    }
  }, [enabled]);

  const playCompleteSound = useCallback(async () => {
    if (Platform.OS === "web" || !enabled) return;
    try {
      const s = completeSoundRef.current;
      if (!s) return;
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch (e) {
      console.log("UI complete sound error:", e);
    }
  }, [enabled]);

  return { playStartSound, playCompleteSound };
}
