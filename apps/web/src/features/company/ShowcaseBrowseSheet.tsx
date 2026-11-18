import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BUSINESS_SHOWCASE_MAX } from '@ekum/domain-types';
import type { DesignBrowseLayout } from '@/lib/designBrowseLayout';
import { ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import { CoverImage } from '@/ui/cards';
import { BrowseLayoutToggle } from '@/ui/BrowseLayoutToggle';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { CameraIcon, CloseIcon, PlusIcon } from '@/ui/icons';
import { Sheet, cx } from '@/ui/kit';
import { patchProfileMedia } from './profileMedia';
import { ShowcaseDesignPhotoSheet } from './ShowcaseDesignPhotoSheet';
import {
  appendShowcaseUrls,
  removeShowcaseUrl,
  showcaseSlotsLeft,
} from './showcaseUrls';
import {
  enqueueShowcaseUploads,
  getShowcasePending,
  isShowcaseUploading,
  subscribeShowcaseUploadSession,
} from './showcaseUploadSession';

/**
 * Showcase browse — grid/feed → PhotoViewer.
 * Owner: Add + × on each tile (no Manage sheet).
 * Add + layout sit under the title (not jammed against Sheet Close).
 */
export function ShowcaseBrowseSheet({
  open,
  onClose,
  urls,
  onOpenPhoto,
  companyId,
  canEdit = false,
}: {
  open: boolean;
  onClose: () => void;
  urls: string[];
  onOpenPhoto: (index: number) => void;
  companyId: string;
  canEdit?: boolean;
}) {
  const [layout, setLayout] = useState<DesignBrowseLayout>('grid');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef(urls);
  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);
  const [addOpen, setAddOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);

  const pending = useSyncExternalStore(
    (listener) => subscribeShowcaseUploadSession(companyId, listener),
    () => getShowcasePending(companyId),
    () => getShowcasePending(companyId),
  );
  const uploading = useSyncExternalStore(
    (listener) => subscribeShowcaseUploadSession(companyId, listener),
    () => isShowcaseUploading(companyId),
    () => isShowcaseUploading(companyId),
  );

  const save = useMutation({
    mutationFn: (showcaseUrls: string[]) =>
      patchProfileMedia(queryClient, companyId, { showcaseUrls }),
    onError: (error) =>
      showToast(
        error instanceof ApiError ? error.message : 'Could not update Showcase.',
        'danger',
      ),
  });

  const occupied = urls.length + pending.length;
  const slots = showcaseSlotsLeft(occupied);
  /** Remove / design pick still wait on PATCH; Add stays open while progressive upload runs. */
  const saveBusy = save.isPending;
  const addDisabled = slots < 1;

  const commit = async (next: string[]) => {
    if (save.isPending) return;
    if (next.length > BUSINESS_SHOWCASE_MAX) {
      showToast(`You can add up to ${BUSINESS_SHOWCASE_MAX} showcase photos.`, 'danger');
      return;
    }
    await save.mutateAsync(next);
  };

  const onUploadFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || slots < 1) return;
    enqueueShowcaseUploads(companyId, Array.from(fileList), {
      queryClient,
      getUrls: () => urlsRef.current,
      onToast: showToast,
    });
  };

  const removeAt = (url: string) => {
    void commit(removeShowcaseUrl(urls, url));
  };

  const chromeRow = (
    <div
      className="flex items-center justify-end gap-2"
      data-testid="showcase-browse-chrome"
    >
      {canEdit ? (
        <button
          type="button"
          data-testid="showcase-add"
          disabled={addDisabled}
          className="inline-flex h-12 items-center gap-1 rounded-xl px-3 text-meta font-emphasis text-accent disabled:opacity-40"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon width={14} height={14} aria-hidden />
          Add
        </button>
      ) : null}
      <BrowseLayoutToggle
        layout={layout}
        testId="showcase-browse-layout"
        className="h-12 w-12 rounded-xl"
        onToggle={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
      />
    </div>
  );

  const committedTile = (url: string, index: number, photoClass: string) => (
    <div
      key={`${url}-${index}`}
      className="relative overflow-hidden rounded-xl bg-foam"
      data-testid={`showcase-browse-tile-${index}`}
    >
      <button
        type="button"
        data-testid={`showcase-browse-photo-${index}`}
        aria-label={`View Showcase photo ${index + 1}`}
        className="block w-full"
        onClick={() => onOpenPhoto(index)}
      >
        <CoverImage src={url} alt="" className={photoClass} />
      </button>
      {canEdit ? (
        <button
          type="button"
          data-testid={`showcase-remove-${index}`}
          aria-label="Remove from Showcase"
          disabled={saveBusy}
          className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-on-accent disabled:opacity-40"
          onClick={(event) => {
            event.stopPropagation();
            removeAt(url);
          }}
        >
          <CloseIcon width={14} height={14} />
        </button>
      ) : null}
    </div>
  );

  const pendingTile = (previewUrl: string, id: string, photoClass: string) => (
    <div
      key={id}
      className="relative overflow-hidden rounded-xl bg-foam"
      data-testid="showcase-browse-pending"
      aria-busy="true"
      aria-label="Uploading Showcase photo"
    >
      {previewUrl ? (
        <CoverImage src={previewUrl} alt="" className={photoClass} priority />
      ) : (
        <div className={cx(photoClass, 'bg-foam')} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-ink/20" />
    </div>
  );

  const photoClass =
    layout === 'feed' ? 'aspect-[4/5] w-full object-cover' : 'aspect-[3/4] w-full object-cover';
  const hasContent = urls.length > 0 || pending.length > 0;

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Showcase" panelClassName="min-h-[50dvh]">
        <div data-testid="showcase-browse-sheet" className="flex min-h-0 flex-1 flex-col gap-2">
          {chromeRow}
          {!hasContent ? (
            <div className="flex flex-col gap-2 py-2" data-testid="showcase-empty">
              <p className="text-sm text-muted">
                {canEdit
                  ? `Add up to ${BUSINESS_SHOWCASE_MAX} photos. Optional.`
                  : 'No Showcase photos yet.'}
              </p>
              {canEdit ? (
                <button
                  type="button"
                  data-testid="showcase-empty-add"
                  disabled={addDisabled}
                  className="self-start text-meta font-emphasis text-accent disabled:opacity-40"
                  onClick={() => setAddOpen(true)}
                >
                  Add photos
                </button>
              ) : null}
            </div>
          ) : layout === 'feed' ? (
            <div className="flex flex-col gap-3" data-testid="showcase-browse-feed">
              {urls.map((url, index) => committedTile(url, index, photoClass))}
              {pending.map((tile) => pendingTile(tile.previewUrl, tile.id, photoClass))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2" data-testid="showcase-browse-grid">
              {urls.map((url, index) => committedTile(url, index, photoClass))}
              {pending.map((tile) => pendingTile(tile.previewUrl, tile.id, photoClass))}
            </div>
          )}
          {hasContent ? (
            <p className={cx('text-meta text-muted', layout === 'grid' ? 'pt-1' : null)}>
              {urls.length === 1 ? '1 photo' : `${urls.length} photos`}
              {uploading || pending.length > 0 ? ' · Uploading…' : null}
              {saveBusy && !uploading ? ' · Saving…' : null}
            </p>
          ) : uploading || pending.length > 0 ? (
            <p className="text-xs text-muted" data-testid="showcase-busy">
              Uploading Showcase…
            </p>
          ) : null}
        </div>
      </Sheet>

      {canEdit ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            data-testid="showcase-upload-input"
            onChange={(event) => {
              onUploadFiles(event.target.files);
              event.target.value = '';
            }}
          />

          <MoreActionsSheet
            open={addOpen}
            onClose={() => setAddOpen(false)}
            title="Add to Showcase"
            testId="showcase-add-menu"
            items={[
              {
                id: 'upload',
                label: 'Upload photo',
                icon: <CameraIcon width={20} height={20} />,
                testId: 'showcase-add-upload',
                disabled: addDisabled,
                onClick: () => {
                  setAddOpen(false);
                  fileRef.current?.click();
                },
              },
              {
                id: 'designs',
                label: 'From my designs',
                icon: <PlusIcon width={20} height={20} />,
                testId: 'showcase-add-designs',
                disabled: addDisabled || saveBusy,
                onClick: () => {
                  setAddOpen(false);
                  setDesignOpen(true);
                },
              },
            ]}
          />

          <ShowcaseDesignPhotoSheet
            open={designOpen}
            onClose={() => setDesignOpen(false)}
            companyId={companyId}
            showcaseUrls={urls}
            busy={saveBusy}
            onConfirm={(picked) => {
              setDesignOpen(false);
              void commit(appendShowcaseUrls(urls, picked));
            }}
          />
        </>
      ) : null}
    </>
  );
}
