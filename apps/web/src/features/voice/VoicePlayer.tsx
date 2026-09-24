import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { formatVoiceDuration } from './voiceCaps';
import {
  claimVoicePlayback,
  releaseVoicePlayback,
} from './voicePlayback';
import { voiceProgressRatio } from './voiceProgress';
import { cx } from '@/ui/kit';

type Props = {
  src: string;
  durationMs?: number | null;
  className?: string;
};

/**
 * Compact play + progress + duration.
 * Uses a JS Audio node — never an in-DOM `<audio>` (Android paints native chrome).
 */
export function VoicePlayer({ src, durationMs, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const toggleLockRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [failed, setFailed] = useState(false);
  const playSrc = useMemo(() => toAbsoluteMediaUrl(src), [src]);

  const stopSelf = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
    }
    if (audio) {
      try {
        audio.currentTime = 0;
      } catch {
        /* ignore seek errors on some blobs */
      }
    }
    playingRef.current = false;
    setPlaying(false);
    setElapsed(0);
    releaseVoicePlayback(stopSelf);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.controls = false;
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', 'true');
    audio.src = playSrc;
    audioRef.current = audio;
    setFailed(false);
    setElapsed(0);
    playingRef.current = false;
    setPlaying(false);

    const onTime = () => setElapsed(audio.currentTime * 1000);
    const onEnd = () => {
      playingRef.current = false;
      setPlaying(false);
      setElapsed(0);
      releaseVoicePlayback(stopSelf);
    };
    const onError = () => {
      playingRef.current = false;
      setPlaying(false);
      setFailed(true);
      releaseVoicePlayback(stopSelf);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
      if (!audio.paused) audio.pause();
      try {
        audio.removeAttribute('src');
        audio.load();
      } catch {
        /* jsdom has no media load */
      }
      if (audioRef.current === audio) audioRef.current = null;
      releaseVoicePlayback(stopSelf);
    };
  }, [playSrc, stopSelf]);

  const toggle = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (toggleLockRef.current || failed) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (playingRef.current) {
      stopSelf();
      return;
    }

    toggleLockRef.current = true;
    claimVoicePlayback(stopSelf);
    void audio
      .play()
      .then(() => {
        playingRef.current = true;
        setFailed(false);
        setPlaying(true);
      })
      .catch(() => {
        playingRef.current = false;
        setPlaying(false);
        setFailed(true);
        releaseVoicePlayback(stopSelf);
      })
      .finally(() => {
        window.setTimeout(() => {
          toggleLockRef.current = false;
        }, 280);
      });
  };

  const labelMs = playing ? elapsed : (durationMs ?? elapsed);
  const fill = voiceProgressRatio(elapsed, durationMs ?? (elapsed > 0 ? elapsed : null));

  return (
    <div
      data-testid="voice-player"
      className={cx(
        'flex w-full min-w-0 max-w-full items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5',
        className,
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label={playing ? 'Pause voice' : 'Play voice'}
        data-testid="voice-play"
        data-card-action
        onClick={toggle}
        onPointerDown={(event) => event.stopPropagation()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white"
      >
        {playing ? (
          <span className="flex gap-0.5" aria-hidden>
            <span className="h-3 w-0.5 rounded-sm bg-white" />
            <span className="h-3 w-0.5 rounded-sm bg-white" />
          </span>
        ) : (
          <span
            className="ml-0.5 h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-white"
            aria-hidden
          />
        )}
      </button>
      <div
        className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line"
        aria-hidden
        data-testid="voice-progress"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${Math.round(fill * 100)}%` }}
        />
      </div>
      <p className="shrink-0 text-[11px] tabular-nums text-muted">
        {failed ? 'Can’t play' : formatVoiceDuration(labelMs)}
      </p>
    </div>
  );
}
