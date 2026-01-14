import { useEffect, useCallback, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

const START_SOUND_URL = 'https://freesound.org/data/previews/320/320655_5260872-lq.mp3';
const COMPLETE_SOUND_URL = 'https://freesound.org/data/previews/320/320654_5260872-lq.mp3';

export function useSessionAudio(enabled: boolean) {
  const startPlayer = useAudioPlayer(START_SOUND_URL);
  const completePlayer = useAudioPlayer(COMPLETE_SOUND_URL);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) return;
    
    const loadPlayers = async () => {
      try {
        hasLoadedRef.current = true;
      } catch (error) {
        console.log('Audio players load error:', error);
      }
    };
    
    loadPlayers();
  }, [enabled, startPlayer, completePlayer]);

  const playStartSound = useCallback(async () => {
    if (Platform.OS === 'web' || !enabled) return;
    
    try {
      startPlayer.seekTo(0);
      startPlayer.play();
    } catch (error) {
      console.log('Start sound error:', error);
    }
  }, [enabled, startPlayer]);

  const playCompleteSound = useCallback(async () => {
    if (Platform.OS === 'web' || !enabled) return;
    
    try {
      completePlayer.seekTo(0);
      completePlayer.play();
    } catch (error) {
      console.log('Complete sound error:', error);
    }
  }, [enabled, completePlayer]);

  return {
    playStartSound,
    playCompleteSound,
  };
}
