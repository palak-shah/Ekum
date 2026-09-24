import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/mediaUpload';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { ApiError } from '@/lib/apiClient';
import { TextInput, cx } from '@/ui/kit';
import { CameraIcon } from '@/ui/icons';
import { commitGroupBlurb, commitGroupTitle } from './groupIdentity';

export function GroupIdentityHero({
  title,
  blurb,
  countLabel,
  imageUrl,
  canEdit,
  busy,
  onSaveTitle,
  onSaveBlurb,
  onSavePhoto,
  onPhotoError,
}: {
  title: string;
  blurb: string;
  countLabel: string;
  imageUrl: string | null;
  canEdit: boolean;
  busy: boolean;
  onSaveTitle: (title: string) => void;
  onSaveBlurb: (blurb: string | null) => void;
  onSavePhoto: (imageUrl: string) => void;
  onPhotoError: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(title);
  const [lineOpen, setLineOpen] = useState(false);
  const [lineDraft, setLineDraft] = useState(blurb);
  const photo = toAbsoluteMediaUrl(imageUrl);
  const initial = (title || 'G').slice(0, 1).toUpperCase();

  const openName = () => {
    setNameDraft(title);
    setNameOpen(true);
  };

  const saveName = () => {
    setNameOpen(false);
    const next = commitGroupTitle(nameDraft, title);
    if (next) onSaveTitle(next);
  };

  const openLine = () => {
    setLineDraft(blurb);
    setLineOpen(true);
  };

  const saveLine = () => {
    setLineOpen(false);
    const next = commitGroupBlurb(lineDraft, blurb);
    if (next !== undefined) onSaveBlurb(next);
  };

  const pickPhoto = () => fileRef.current?.click();

  return (
    <div className="flex flex-col items-center gap-2 pb-4">
      <div className="relative">
        {canEdit ? (
          <button
            type="button"
            data-testid="group-info-photo"
            aria-label="Add photo"
            disabled={busy || photoBusy}
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-foam text-lg font-semibold text-muted"
            onClick={pickPhoto}
          >
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-foam text-lg font-semibold text-muted">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
        )}
        {canEdit ? (
          <span
            className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-canvas bg-accent text-white"
            aria-hidden
          >
            <CameraIcon width={14} height={14} />
          </span>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setPhotoBusy(true);
            void uploadImage(file)
              .then((url) => onSavePhoto(url))
              .catch((err) =>
                onPhotoError(err instanceof ApiError ? err.message : 'Could not add photo.'),
              )
              .finally(() => setPhotoBusy(false));
          }}
        />
      </div>

      {canEdit && nameOpen ? (
        <TextInput
          autoFocus
          data-testid="group-info-name"
          aria-label="Group name"
          value={nameDraft}
          maxLength={120}
          disabled={busy}
          className="text-center text-lg font-semibold"
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={saveName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              setNameOpen(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          data-testid="group-info-name"
          disabled={!canEdit || busy}
          className={cx(
            'max-w-full text-center text-lg font-semibold tracking-tight text-ink',
            canEdit ? '' : 'cursor-default',
          )}
          onClick={canEdit ? openName : undefined}
        >
          {title}
        </button>
      )}

      <p className="text-xs font-medium text-muted">{countLabel}</p>

      {canEdit && lineOpen ? (
        <TextInput
          autoFocus
          data-testid="group-info-line"
          aria-label="One line"
          value={lineDraft}
          maxLength={80}
          disabled={busy}
          placeholder="What this group is for"
          className="text-center text-sm"
          onChange={(event) => setLineDraft(event.target.value)}
          onBlur={saveLine}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              setLineOpen(false);
            }
          }}
        />
      ) : blurb ? (
        <button
          type="button"
          data-testid="group-info-description"
          disabled={!canEdit || busy}
          className={cx(
            'max-w-full text-center text-sm text-ink',
            canEdit ? '' : 'cursor-default',
          )}
          onClick={canEdit ? openLine : undefined}
        >
          {blurb}
        </button>
      ) : canEdit ? (
        <button
          type="button"
          data-testid="group-info-add-line"
          disabled={busy}
          className="text-sm font-semibold text-accent"
          onClick={openLine}
        >
          Add a line
        </button>
      ) : null}
    </div>
  );
}
