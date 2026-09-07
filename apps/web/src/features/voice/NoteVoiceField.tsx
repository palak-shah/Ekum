import { useEffect, useState } from 'react';
import { uploadAudio } from '@/lib/mediaUpload';
import { ApiError } from '@/lib/apiClient';
import { Button, TextArea, cx } from '@/ui/kit';
import { MicIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { VoicePlayer } from './VoicePlayer';
import { noteVoiceSheetBusy } from './noteVoiceBusy';
import { formatVoiceDuration, isUsableVoiceClip } from './voiceCaps';
import { useVoiceRecorder } from './useVoiceRecorder';

export type NoteVoiceValue = {
  mediaId: string;
  url: string;
  durationMs: number;
} | null;

type Props = {
  label: string;
  note: string;
  onNoteChange: (value: string) => void;
  voice: NoteVoiceValue;
  onVoiceChange: (value: NoteVoiceValue) => void;
  /** True while recording or uploading — disable sheet CTAs. */
  onBusyChange?: (busy: boolean) => void;
  rows?: number;
  optional?: boolean;
};

/** Text note + optional voice clip (order sheets). */
export function NoteVoiceField({
  label,
  note,
  onNoteChange,
  voice,
  onVoiceChange,
  onBusyChange,
  rows = 3,
  optional = true,
}: Props) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const recorder = useVoiceRecorder();

  useEffect(() => {
    onBusyChange?.(noteVoiceSheetBusy({ uploading, recording: recorder.recording }));
  }, [uploading, recorder.recording, onBusyChange]);

  const onMic = async () => {
    if (recorder.recording) {
      const clip = await recorder.stopAndGet();
      if (
        !clip ||
        !isUsableVoiceClip({ durationMs: clip.durationMs, sizeBytes: clip.blob.size })
      ) {
        showToast('Recording too short.', 'danger');
        return;
      }
      setUploading(true);
      try {
        const uploaded = await uploadAudio(clip.blob);
        onVoiceChange({
          mediaId: uploaded.mediaId,
          url: uploaded.url,
          durationMs: clip.durationMs,
        });
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : 'Could not save voice.',
          'danger',
        );
      } finally {
        setUploading(false);
      }
      return;
    }
    const err = await recorder.start();
    if (err) {
      showToast(err, 'danger');
      return;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {label}
          {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
        </p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => void onMic()}
          className={cx(
            'flex h-9 w-9 items-center justify-center rounded-full border',
            recorder.recording
              ? 'border-danger bg-danger/10 text-danger'
              : 'border-line text-muted hover:text-ink',
          )}
          aria-label={recorder.recording ? 'Stop recording' : 'Record voice note'}
        >
          <MicIcon width={18} height={18} />
        </button>
      </div>
      {recorder.recording ? (
        <p className="text-xs text-danger">
          Recording… {formatVoiceDuration(recorder.elapsedMs)} · tap mic to stop
        </p>
      ) : null}
      <TextArea
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        rows={rows}
      />
      {voice ? (
        <div className="flex items-start gap-2">
          <VoicePlayer src={voice.url} durationMs={voice.durationMs} className="flex-1" />
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 px-3"
            onClick={() => onVoiceChange(null)}
          >
            ×
          </Button>
        </div>
      ) : null}
    </div>
  );
}
