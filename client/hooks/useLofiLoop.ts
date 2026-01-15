import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { Platform } from "react-native";

const LOFI_LOOP_URL = 'https://freesound.org/data/previews/612/612095_5674468-lq.mp3';

export function useLofiLoop(enabled: boolean, volume: number = 0.4) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [positionMs, setPositionMs] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let mounted = true;

    const load = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: LOFI_LOOP_URL },
          { shouldPlay: false, isLooping: true, volume },
          (status) => {
            if (!mounted) return;
            if ("positionMillis" in status && status.isLoaded) {
              setPositionMs(status.positionMillis ?? 0);
            }
          }
        );
        soundRef.current = sound;
        setIsReady(true);
      } catch (e) {
        console.log('Lofi loop load error:', e);
        setIsReady(false);
      }
    };

    load();

    return () => {
      mounted = false;
      const s = soundRef.current;
      soundRef.current = null;
      if (s) {
        s.unloadAsync().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    const s = soundRef.current;
    if (!s) return;
    s.setVolumeAsync(volume).catch(() => undefined);
  }, [volume]);

  const start = useCallback(async () => {
    if (!enabled || Platform.OS === "web") return;
    const s = soundRef.current;
    if (!s) return;
    try {
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch {
      // ignore
    }
  }, [enabled]);

  const stop = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    try {
      await s.stopAsync();
      await s.setPositionAsync(0);
    } catch {
      // ignore
    }
  }, []);

  return { start, stop, positionMs, isReady };
}
