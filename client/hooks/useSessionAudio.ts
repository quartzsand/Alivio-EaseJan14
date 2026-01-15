import { useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const START_SOUND_URL = 'https://freesound.org/data/previews/320/320655_5260872-lq.mp3';
const COMPLETE_SOUND_URL = 'https://freesound.org/data/previews/320/320654_5260872-lq.mp3';

export function useSessionAudio(enabled: boolean) {
  const startSoundRef = useRef<Audio.Sound | null>(null);
  const completeSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) return;
    
    const loadSounds = async () => {
      try {
        const { sound: startSound } = await Audio.Sound.createAsync(
          { uri: START_SOUND_URL },
          { shouldPlay: false }
        );
        startSoundRef.current = startSound;

        const { sound: completeSound } = await Audio.Sound.createAsync(
          { uri: COMPLETE_SOUND_URL },
          { shouldPlay: false }
        );
        completeSoundRef.current = completeSound;
      } catch (error) {
        console.log('Audio load error:', error);
      }
    };
    
    loadSounds();

    return () => {
      startSoundRef.current?.unloadAsync();
      completeSoundRef.current?.unloadAsync();
    };
  }, [enabled]);

  const playStartSound = useCallback(async () => {
    if (Platform.OS === 'web' || !enabled) return;
    
    try {
      const sound = startSoundRef.current;
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.log('Start sound error:', error);
    }
  }, [enabled]);

  const playCompleteSound = useCallback(async () => {
    if (Platform.OS === 'web' || !enabled) return;
    
    try {
      const sound = completeSoundRef.current;
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.log('Complete sound error:', error);
    }
  }, [enabled]);

  return {
    playStartSound,
    playCompleteSound,
  };
}
