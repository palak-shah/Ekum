import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_MAX_DURATION_MS, pickAudioMimeType } from './voiceCaps';
import { stopAllVoicePlayback } from './voicePlayback';

export type VoiceRecording = {
  blob: Blob;
  durationMs: number;
};

type Options = {
  maxDurationMs?: number;
  onMaxDuration?: (recording: VoiceRecording) => void;
};

export function useVoiceRecorder(options: Options = {}) {
  const maxDurationMs = options.maxDurationMs ?? VOICE_MAX_DURATION_MS;
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelRef = useRef(false);

  const clearTick = () => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      clearTick();
      stopTracks();
      if (mediaRef.current?.state === 'recording') {
        mediaRef.current.stop();
      }
    },
    [],
  );

  const finish = useCallback(
    (mode: 'send' | 'cancel'): Promise<VoiceRecording | null> =>
      new Promise((resolve) => {
        const recorder = mediaRef.current;
        if (!recorder || recorder.state === 'inactive') {
          setRecording(false);
          clearTick();
          stopTracks();
          resolve(null);
          return;
        }
        cancelRef.current = mode === 'cancel';
        recorder.onstop = () => {
          clearTick();
          stopTracks();
          setRecording(false);
          mediaRef.current = null;
          if (cancelRef.current) {
            chunksRef.current = [];
            resolve(null);
            return;
          }
          const mime = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mime });
          chunksRef.current = [];
          const durationMs = Math.min(
            maxDurationMs,
            Math.max(0, Date.now() - startedAtRef.current),
          );
          if (blob.size < 1) {
            resolve(null);
            return;
          }
          resolve({ blob, durationMs });
        };
        recorder.stop();
      }),
    [maxDurationMs],
  );

  const finishRef = useRef(finish);
  finishRef.current = finish;
  const onMaxDurationRef = useRef(options.onMaxDuration);
  onMaxDurationRef.current = options.onMaxDuration;

  const start = useCallback(async (): Promise<string | null> => {
    setError(null);
    cancelRef.current = false;
    chunksRef.current = [];
    // Speakers → mic echo is the usual “double sound” in a new clip.
    stopAllVoicePlayback();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      const mime = pickAudioMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setElapsedMs(elapsed);
        if (elapsed >= maxDurationMs && mediaRef.current?.state === 'recording') {
          void finishRef.current('send').then((result) => {
            if (result) onMaxDurationRef.current?.(result);
          });
        }
      }, 200);
      // No timeslice — chunked webm often plays choppy / “broken” in browsers.
      recorder.start();
      return null;
    } catch {
      const message = 'Allow microphone to send voice.';
      setError(message);
      stopTracks();
      setRecording(false);
      return message;
    }
  }, [maxDurationMs]);

  return {
    recording,
    elapsedMs,
    error,
    start,
    stopAndGet: () => finish('send'),
    cancel: () => finish('cancel'),
    clearError: () => setError(null),
  };
}
