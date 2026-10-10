import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/lib/mediaUpload';
import { ApiError } from '@/lib/apiClient';
import { CameraIcon, ImageIcon, PlusIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { MAX_LEG_PHOTOS } from '@/features/orders/dispatchSheet';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';

/** Quiet photo attach under an LR · Bill row — thumbs always show when attached. */
export function LegPhotoAttach({
  images,
  onImagesChange,
  testIdPrefix = 'leg-photo',
}: {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  testIdPrefix?: string;
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const onPickPhotos = async (files: FileList | null, input: HTMLInputElement | null) => {
    if (!files?.length) return;
    const room = MAX_LEG_PHOTOS - images.length;
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

  const full = images.length >= MAX_LEG_PHOTOS;

  return (
    <div className="flex flex-col gap-1.5" ref={wrapRef} data-testid={`${testIdPrefix}-attach`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted">
          LR photo
          {images.length > 0 ? (
            <span className="font-normal"> · {images.length}</span>
          ) : (
            <span className="font-normal"> (optional)</span>
          )}
        </p>
        <div className="relative">
          <button
            type="button"
            disabled={uploading || full}
            data-testid={`${testIdPrefix}-plus`}
            aria-label="Add LR photo"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink disabled:opacity-40"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <PlusIcon width={16} height={16} />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              data-testid={`${testIdPrefix}-menu`}
              className="absolute right-0 z-20 mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-sm"
            >
              <button
                type="button"
                role="menuitem"
                disabled={full}
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
                disabled={full}
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
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2" data-testid={`${testIdPrefix}-thumbs`}>
          {images.map((url) => {
            const src = toAbsoluteMediaUrl(url) || url;
            return (
              <div
                key={url}
                className="relative h-14 w-14 overflow-hidden rounded-lg bg-foam"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove LR photo"
                  data-testid={`${testIdPrefix}-remove`}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-[10px] text-white"
                  onClick={() => onImagesChange(images.filter((item) => item !== url))}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Read-only thumbs for shipment history / prior LR cards. */
export function LegPhotoThumbs({
  images,
  testId,
}: {
  images: string[];
  testId?: string;
}) {
  if (images.length < 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5" data-testid={testId ?? 'leg-photo-thumbs'}>
      {images.map((url) => {
        const src = toAbsoluteMediaUrl(url) || url;
        return (
          <div
            key={url}
            className="h-12 w-12 overflow-hidden rounded-lg bg-foam"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}
