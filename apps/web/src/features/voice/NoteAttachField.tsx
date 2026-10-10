import { useEffect, useRef, useState } from 'react';
import { uploadAudio, uploadImage } from '@/lib/mediaUpload';
import { ApiError } from '@/lib/apiClient';
import { Button, TextArea, cx } from '@/ui/kit';
import { CameraIcon, ImageIcon, MicIcon, PlusIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { voiceStageFromClip } from './chatVoiceHold';
import { VoicePlayer } from './VoicePlayer';
import { noteVoiceSheetBusy } from './noteVoiceBusy';
import { formatVoiceDuration, isUsableVoiceClip } from './voiceCaps';
import { useVoiceRecorder } from './useVoiceRecorder';
import type { NoteVoiceValue } from './NoteVoiceField';

const IMAGE_CAP = 9;

type Props = {
  label: string;
  note: string;
  onNoteChange: (value: string) => void;
  voice: NoteVoiceValue;
  onVoiceChange: (value: NoteVoiceValue) => void;
  images: string[];
  onImagesChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
  rows?: number;
  optional?: boolean;
  /** When false, + menu offers photos only (Manual order no.). */
  allowVoice?: boolean;
  className?: string;
};

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** Text note + quiet + tray for Voice · Camera · Gallery (order action sheets). */
export function NoteAttachField({
  label,
  note,
  onNoteChange,
  voice,
  onVoiceChange,
  images,
  onImagesChange,
  onBusyChange,
  rows = 2,
  optional = true,
  allowVoice = true,
  className,
}: Props) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();
  const voiceUrlRef = useRef(voice?.url);
  voiceUrlRef.current = voice?.url;
  const micBusyRef = useRef(false);

  useEffect(() => {
    onBusyChange?.(
      noteVoiceSheetBusy({ uploading, recording: recorder.recording }) || uploading,
    );
  }, [uploading, recorder.recording, onBusyChange]);

  useEffect(
    () => () => {
      revokeIfBlob(voiceUrlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const clearVoice = () => {
    revokeIfBlob(voice?.url);
    onVoiceChange(null);
  };

  const finishRecording = async () => {
    if (micBusyRef.current || uploading) return;
    micBusyRef.current = true;
    try {
      const clip = await recorder.stopAndGet();
      const decision = voiceStageFromClip({
        clip: clip
          ? { durationMs: clip.durationMs, sizeBytes: clip.blob.size }
          : null,
        didRecord: true,
        isUsable: isUsableVoiceClip,
      });
      if (decision.kind === 'too_short') {
        showToast('Recording too short.', 'danger');
        return;
      }
      if (decision.kind === 'failed' || decision.kind === 'silent' || !clip) {
        showToast('Could not save voice. Try again.', 'danger');
        return;
      }
      const previewUrl = URL.createObjectURL(clip.blob);
      revokeIfBlob(voice?.url);
      setUploading(true);
      try {
        const uploaded = await uploadAudio(clip.blob);
        onVoiceChange({
          mediaId: uploaded.mediaId,
          url: previewUrl,
          durationMs: clip.durationMs,
        });
      } catch (err) {
        revokeIfBlob(previewUrl);
        showToast(
          err instanceof ApiError ? err.message : 'Could not save voice.',
          'danger',
        );
      } finally {
        setUploading(false);
      }
    } finally {
      micBusyRef.current = false;
    }
  };

  const onMic = async () => {
    setMenuOpen(false);
    if (micBusyRef.current || uploading) return;
    if (recorder.recording) {
      await finishRecording();
      return;
    }
    micBusyRef.current = true;
    try {
      const err = await recorder.start();
      if (err) showToast(err, 'danger');
    } finally {
      micBusyRef.current = false;
    }
  };

  const onPickPhotos = async (files: FileList | null, input: HTMLInputElement | null) => {
    if (!files?.length) return;
    const room = IMAGE_CAP - images.length;
    if (room <= 0) return;
    setUploading(true);
    try {
      const next = [...images];
      for (const file of [...files].slice(0, room)) {
        next.push(await uploadImage(file));
      }
      onImagesChange(next);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not add photo.', 'danger');
    } finally {
      setUploading(false);
      if (input) input.value = '';
    }
  };

  const photosFull = images.length >= IMAGE_CAP;

  return (
    <div className="flex flex-col gap-2" ref={wrapRef}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {label}
          {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
        </p>
        <div className="relative">
          <button
            type="button"
            disabled={uploading || recorder.recording}
            data-testid="note-attach-plus"
            aria-label="Add voice or photo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink disabled:opacity-40"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <PlusIcon width={18} height={18} />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              data-testid="note-attach-menu"
              className="absolute right-0 z-20 mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-sm"
            >
              {allowVoice ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-foam"
                  onClick={() => void onMic()}
                >
                  <MicIcon width={16} height={16} className="text-muted" />
                  Voice
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                disabled={photosFull}
                data-testid="note-attach-camera"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-foam disabled:opacity-40"
                onClick={() => {
                  setMenuOpen(false);
                  cameraRef.current?.click();
                }}
              >
                <CameraIcon width={16} height={16} className="text-muted" />
                Take photo
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={photosFull}
                data-testid="note-attach-gallery"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-foam disabled:opacity-40"
                onClick={() => {
                  setMenuOpen(false);
                  galleryRef.current?.click();
                }}
              >
                <ImageIcon width={16} height={16} className="text-muted" />
                Gallery
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void onPickPhotos(event.target.files, cameraRef.current)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void onPickPhotos(event.target.files, galleryRef.current)}
      />
      {recorder.recording ? (
        <div
          className="flex items-center justify-between gap-2 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2"
          data-testid="note-attach-recording"
        >
          <p className="text-sm font-medium text-danger">
            Recording… {formatVoiceDuration(recorder.elapsedMs)}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 px-3 text-danger"
            data-testid="note-attach-stop"
            onClick={() => void finishRecording()}
          >
            Stop
          </Button>
        </div>
      ) : null}
      <TextArea
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        rows={rows}
        className={cx(
          'ekum-no-scrollbar resize-none overflow-y-auto',
          rows <= 2 && '!h-[4.25rem] !min-h-[4.25rem] !max-h-[4.25rem]',
          className,
        )}
      />
      {voice ? (
        <div className="flex items-start gap-2">
          <VoicePlayer src={voice.url} durationMs={voice.durationMs} className="flex-1" />
          <Button type="button" variant="secondary" className="shrink-0 px-3" onClick={clearVoice}>
            ×
          </Button>
        </div>
      ) : null}
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative h-14 w-14 overflow-hidden rounded-lg bg-foam">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-[10px] text-white"
                onClick={() => onImagesChange(images.filter((item) => item !== url))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
