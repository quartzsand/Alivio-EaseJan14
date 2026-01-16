// client/hooks/useSessionAudio.ts
import { useEffect, useCallback, useRef } from "react";
import { Audio } from "expo-av";
import { Platform } from "react-native";

const START_SOUND = require("../../assets/audio/ui_start.mp3");
const COMPLETE_SOUND = require("../../assets/audio/ui_complete.mp3");

export function useSessionAudio(enabled: boolean) {
  const startSoundRef = useRef<Audio.Sound | null>(null);
  const completeSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || !enabled) return;

    let mounted = true;

    const load = async () => {
      try {
        const { sound: startSound } = await Audio.Sound.createAsync(
          START_SOUND,
          { shouldPlay: false }
        );
        const { sound: completeSound } = await Audio.Sound.createAsync(
          COMPLETE_SOUND,
          { shouldPlay: false }
        );

        if (!mounted) {
          await startSound.unloadAsync();
          await completeSound.unloadAsync();
          return;
        }

        startSoundRef.current = startSound;
        completeSoundRef.current = completeSound;
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
      const sound = startSoundRef.current;
      if (!sound) return;
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (e) {
      console.log("Start sound error:", e);
    }
  }, [enabled]);

  const playCompleteSound = useCallback(async () => {
    if (Platform.OS === "web" || !enabled) return;
    try {
      const sound = completeSoundRef.current;
      if (!sound) return;
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (e) {
      console.log("Complete sound error:", e);
    }
  }, [enabled]);

  return { playStartSound, playCompleteSound };
}
