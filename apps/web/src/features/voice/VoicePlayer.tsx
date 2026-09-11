import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { formatVoiceDuration } from './voiceCaps';
import {
  claimVoicePlayback,
  releaseVoicePlayback,
} from './voicePlayback';
import { cx } from '@/ui/kit';

type Props = {
  src: string;
  durationMs?: number | null;
  className?: string;
};

/** Compact play/pause + duration for chat bubbles and order notes. */
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
    const audio = audioRef.current;
    if (!audio) return;

    stopSelf();
    setFailed(false);

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
      stopSelf();
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
        // Ignore a second tap that arrives in the same gesture (mobile ghost click).
        window.setTimeout(() => {
          toggleLockRef.current = false;
        }, 280);
      });
  };

  const labelMs = playing ? elapsed : (durationMs ?? elapsed);

  return (
    <div
      className={cx(
        'flex min-w-[10rem] max-w-full items-center gap-2 rounded-2xl border border-line bg-surface px-2.5 py-2',
        className,
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={playSrc}
        preload="metadata"
        playsInline
        className="hidden"
      />
      <button
        type="button"
        aria-label={playing ? 'Pause voice' : 'Play voice'}
        data-testid="voice-play"
        data-card-action
        onClick={toggle}
        onPointerDown={(event) => event.stopPropagation()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white"
      >
        {playing ? (
          <span className="flex gap-0.5" aria-hidden>
            <span className="h-3 w-1 rounded-sm bg-white" />
            <span className="h-3 w-1 rounded-sm bg-white" />
          </span>
        ) : (
          <span
            className="ml-0.5 h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white"
            aria-hidden
          />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex h-2 items-center gap-0.5" aria-hidden>
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={cx(
                'w-0.5 rounded-full bg-accent/40',
                playing && i % 3 === 0 ? 'h-2.5 bg-accent' : 'h-1.5',
              )}
            />
          ))}
        </div>
        <p className="mt-0.5 text-[11px] tabular-nums text-muted">
          {failed ? 'Can’t play' : formatVoiceDuration(labelMs)}
        </p>
      </div>
    </div>
  );
}
