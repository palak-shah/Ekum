import { useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/apiClient';
import { uploadImage } from '@/lib/mediaUpload';
import { useToast } from '@/ui/Toast';
import { Avatar, cx } from '@/ui/kit';
import { CameraIcon, TrashIcon } from '@/ui/icons';
import { CoverImage } from '@/ui/cards';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { patchProfileMedia } from './profileMedia';

/** Photo cover — full bleed on phone. Empty Add cover uses a quieter shorter shell. */
const COVER_SHELL_PHOTO =
  'relative -mx-4 aspect-[2.4/1] w-[calc(100%+2rem)] overflow-hidden bg-foam sm:mx-0 sm:w-full sm:rounded-xl';

const COVER_SHELL_EMPTY =
  'relative -mx-4 aspect-[3.2/1] w-[calc(100%+2rem)] overflow-hidden bg-foam/70 sm:mx-0 sm:w-full sm:rounded-xl';

/**
 * Own Home hero — cover + avatar cameras. Shop / strangers pass canEdit=false
 * (display only). Camera never opens the gallery; cover image tap does.
 * Avatar is centred and overlaps the cover bottom edge (prototype composition).
 */
export function BusinessProfileHeroMedia({
  companyId,
  name,
  logoUrl,
  coverUrl,
  canEdit,
  onOpenCoverGallery,
  onOpenShowcase,
  showcaseCount = 0,
  identity,
}: {
  companyId: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  canEdit: boolean;
  onOpenCoverGallery: () => void;
  /** Opens Showcase browse sheet. Visitor: count > 0. Owner: always (Add when empty). */
  onOpenShowcase?: () => void;
  showcaseCount?: number;
  /** Name / city / about — centred under the avatar. */
  identity: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const coverFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [coverUploadBusy, setCoverUploadBusy] = useState(false);
  const [avatarUploadBusy, setAvatarUploadBusy] = useState(false);

  const patchMedia = useMutation({
    mutationFn: (patch: { logoUrl: string | null } | { coverUrl: string | null }) =>
      patchProfileMedia(queryClient, companyId, patch),
    onError: (error) =>
      showToast(
        error instanceof ApiError ? error.message : 'Could not update photo.',
        'danger',
      ),
  });

  const coverBusy =
    coverUploadBusy || (patchMedia.isPending && 'coverUrl' in (patchMedia.variables ?? {}));
  const avatarBusy =
    avatarUploadBusy || (patchMedia.isPending && 'logoUrl' in (patchMedia.variables ?? {}));

  const pickCover = () => coverFileRef.current?.click();
  const pickAvatar = () => avatarFileRef.current?.click();

  const onCoverFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || coverBusy) return;
    setCoverUploadBusy(true);
    void uploadImage(file)
      .then((url) => patchMedia.mutateAsync({ coverUrl: url }))
      .catch((error) =>
        showToast(
          error instanceof ApiError ? error.message : 'Could not upload cover.',
          'danger',
        ),
      )
      .finally(() => setCoverUploadBusy(false));
  };

  const onAvatarFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || avatarBusy) return;
    setAvatarUploadBusy(true);
    void uploadImage(file)
      .then((url) => patchMedia.mutateAsync({ logoUrl: url }))
      .catch((error) =>
        showToast(
          error instanceof ApiError ? error.message : 'Could not upload photo.',
          'danger',
        ),
      )
      .finally(() => setAvatarUploadBusy(false));
  };

  const onCoverCamera = () => {
    if (coverBusy || !coverUrl) return;
    setCoverMenuOpen(true);
  };

  const onAvatarCamera = () => {
    if (avatarBusy) return;
    if (logoUrl) {
      setAvatarMenuOpen(true);
      return;
    }
    pickAvatar();
  };

  const showCoverShell = Boolean(coverUrl) || canEdit || showcaseCount > 0;
  const hasPhotoCover = Boolean(coverUrl);

  return (
    <>
      <div className="relative" data-testid="business-profile-hero">
        {showCoverShell ? (
          <div
            className={hasPhotoCover ? COVER_SHELL_PHOTO : COVER_SHELL_EMPTY}
            data-testid="business-profile-cover-shell"
          >
            {coverUrl ? (
              <button
                type="button"
                data-testid="business-profile-cover"
                aria-label="View cover photo"
                className="absolute inset-0 block h-full w-full"
                onClick={onOpenCoverGallery}
              >
                <CoverImage src={coverUrl} alt="" priority className="h-full w-full object-cover" />
              </button>
            ) : canEdit ? (
              <button
                type="button"
                data-testid="business-profile-add-cover"
                disabled={coverBusy}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm font-emphasis text-muted disabled:opacity-45"
                onClick={pickCover}
              >
                <CameraIcon width={20} height={20} aria-hidden />
                {coverBusy ? 'Uploading…' : 'Add cover'}
              </button>
            ) : (
              <div className="h-full w-full" aria-hidden />
            )}

            {onOpenShowcase && (showcaseCount > 0 || canEdit) ? (
              <button
                type="button"
                data-testid="business-profile-view-showcase"
                className="absolute bottom-2 left-2 z-10 max-w-[70%] truncate rounded-full bg-ink/60 px-2.5 py-1 text-meta font-emphasis text-on-accent"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenShowcase();
                }}
              >
                {canEdit && showcaseCount < 1
                  ? 'Add Showcase ›'
                  : showcaseCount > 1
                    ? `View Showcase · ${showcaseCount} ›`
                    : 'View Showcase ›'}
              </button>
            ) : null}

            {canEdit && coverUrl ? (
              <button
                type="button"
                data-testid="business-profile-cover-camera"
                aria-label="Change cover photo"
                disabled={coverBusy}
                className="absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-canvas bg-accent text-on-accent disabled:opacity-45"
                onClick={(event) => {
                  event.stopPropagation();
                  onCoverCamera();
                }}
              >
                <CameraIcon width={16} height={16} />
              </button>
            ) : null}

            {coverBusy && coverUrl ? (
              <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-ink/35 text-sm font-emphasis text-on-accent">
                Uploading…
              </div>
            ) : null}
          </div>
        ) : null}

        {/* -mt-11 ≈ half of 88px avatar so the circle overlaps the cover without clipping */}
        <div
          className={cx(
            'relative z-[1] flex flex-col items-center',
            showCoverShell ? '-mt-11' : null,
          )}
          data-testid="business-profile-avatar-block"
        >
          <div className="relative shrink-0 rounded-full border-[3px] border-canvas bg-canvas">
            <Avatar name={name} imageUrl={logoUrl} size={88} />
            {canEdit ? (
              <button
                type="button"
                data-testid="business-profile-avatar-camera"
                aria-label={logoUrl ? 'Change profile photo' : 'Add profile photo'}
                disabled={avatarBusy}
                className="absolute -bottom-0.5 -right-0.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-canvas bg-accent text-on-accent disabled:opacity-45"
                onClick={onAvatarCamera}
              >
                <CameraIcon width={14} height={14} />
              </button>
            ) : null}
            {avatarBusy ? (
              <span
                className={cx(
                  'pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-ink/40 text-[10px] font-emphasis text-on-accent',
                )}
                aria-hidden
              >
                …
              </span>
            ) : null}
          </div>

          <div
            className="mt-3 w-full min-w-0 text-center [&_.flex]:justify-center"
            data-testid="business-profile-identity"
          >
            {identity}
          </div>
        </div>
      </div>

      {canEdit ? (
        <>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            data-testid="business-profile-cover-input"
            onChange={(event) => {
              onCoverFile(event.target.files);
              event.target.value = '';
            }}
          />
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            data-testid="business-profile-avatar-input"
            onChange={(event) => {
              onAvatarFile(event.target.files);
              event.target.value = '';
            }}
          />
        </>
      ) : null}

      <MoreActionsSheet
        open={coverMenuOpen}
        onClose={() => setCoverMenuOpen(false)}
        title="Cover photo"
        testId="business-profile-cover-menu"
        items={[
          {
            id: 'change',
            label: 'Change cover',
            icon: <CameraIcon width={20} height={20} />,
            testId: 'business-profile-cover-change',
            onClick: () => {
              setCoverMenuOpen(false);
              pickCover();
            },
          },
          {
            id: 'remove',
            label: 'Remove cover',
            icon: <TrashIcon width={20} height={20} />,
            testId: 'business-profile-cover-remove',
            danger: true,
            onClick: () => {
              setCoverMenuOpen(false);
              patchMedia.mutate({ coverUrl: null });
            },
          },
        ]}
      />

      <MoreActionsSheet
        open={avatarMenuOpen}
        onClose={() => setAvatarMenuOpen(false)}
        title="Profile photo"
        testId="business-profile-avatar-menu"
        items={[
          {
            id: 'change',
            label: 'Change photo',
            icon: <CameraIcon width={20} height={20} />,
            testId: 'business-profile-avatar-change',
            onClick: () => {
              setAvatarMenuOpen(false);
              pickAvatar();
            },
          },
          {
            id: 'remove',
            label: 'Remove photo',
            icon: <TrashIcon width={20} height={20} />,
            testId: 'business-profile-avatar-remove',
            danger: true,
            onClick: () => {
              setAvatarMenuOpen(false);
              patchMedia.mutate({ logoUrl: null });
            },
          },
        ]}
      />
    </>
  );
}
