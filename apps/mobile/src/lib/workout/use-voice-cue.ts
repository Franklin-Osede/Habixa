import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import api from '../../services/api.client';

export type VoiceCueKind =
  | 'intro'
  | 'mid_set'
  | 'last_rep'
  | 'rest_start'
  | 'morning_summary';

interface CueResponse {
  audioUrl: string;
  scriptText: string;
  durationMs: number | null;
  voicePersona: string;
  locale: string;
  cueKind: VoiceCueKind;
  exerciseId: string | null;
}

interface PlayCueInput {
  kind: VoiceCueKind;
  exerciseId?: string;
  /**
   * If true (default), bails silently when the API or audio playback
   * fails. Voice cues are accessory: a missing cue must never break
   * the workout session.
   */
  graceful?: boolean;
}

/**
 * Hook for playing AI-generated voice cues during a workout.
 *
 * Each call to playCue:
 *   1. Asks /v1/voice/cue for an audioUrl (cache-aside on the backend
 *      means the first request per exercise is ~1-2s; subsequent ones
 *      are instant).
 *   2. Unloads the previous Sound (so cues do not stack).
 *   3. Loads + plays the new Sound via expo-av.
 *
 * iOS silent-mode is honoured by default — callers do not need to
 * worry about it. The hook also unloads any active sound on unmount
 * so navigating away mid-cue does not leak a player.
 */
export function useVoiceCue() {
  const soundRef = useRef<Audio.Sound | null>(null);

  // Configure the audio mode once. Without this iOS silently refuses
  // to play when the device is muted, which is the common case for
  // someone working out with their phone face-down.
  useEffect(() => {
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return () => {
      void unloadSound(soundRef.current);
      soundRef.current = null;
    };
  }, []);

  const playCue = async ({
    kind,
    exerciseId,
    graceful = true,
  }: PlayCueInput): Promise<void> => {
    try {
      const params = new URLSearchParams({ kind });
      if (exerciseId) params.set('exerciseId', exerciseId);
      const res = await api.get<CueResponse>(`/voice/cue?${params.toString()}`);
      const url = res.data?.audioUrl;
      if (!url) return;

      // Unload the previous sound BEFORE creating the next one — leaks
      // are subtle on iOS and will eventually starve the audio session.
      await unloadSound(soundRef.current);
      soundRef.current = null;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, volume: 1.0 },
      );
      soundRef.current = sound;
    } catch (err) {
      if (!graceful) throw err;
      // eslint-disable-next-line no-console
      console.warn('[voice-cue] playback failed', err);
    }
  };

  const stopCue = async () => {
    await unloadSound(soundRef.current);
    soundRef.current = null;
  };

  return { playCue, stopCue };
}

async function unloadSound(sound: Audio.Sound | null): Promise<void> {
  if (!sound) return;
  try {
    await sound.unloadAsync();
  } catch {
    // The sound may already be unloaded if the user paused / ended early.
    // Either way the GC handles the underlying resource — nothing to do.
  }
}
