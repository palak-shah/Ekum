import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BUSINESS_SHOWCASE_MAX } from '@ekum/domain-types';
import type { DesignBrowseLayout } from '@/lib/designBrowseLayout';
import { ApiError } from '@/lib/apiClient';
import { uploadImage } from '@/lib/mediaUpload';
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

/**
 * Showcase browse — grid/feed → PhotoViewer.
 * Owner: Add + × on each tile (no Manage sheet).
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
  const [addOpen, setAddOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const save = useMutation({
    mutationFn: (showcaseUrls: string[]) =>
      patchProfileMedia(queryClient, companyId, { showcaseUrls }),
    onError: (error) =>
      showToast(
        error instanceof ApiError ? error.message : 'Could not update Showcase.',
        'danger',
      ),
  });

  const busy = uploadBusy || save.isPending;
  const slots = showcaseSlotsLeft(urls.length);

  const commit = async (next: string[]) => {
    if (save.isPending) return;
    if (next.length > BUSINESS_SHOWCASE_MAX) {
      showToast(`You can add up to ${BUSINESS_SHOWCASE_MAX} showcase photos.`, 'danger');
      return;
    }
    await save.mutateAsync(next);
  };

  const onUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || busy || slots < 1) return;
    const files = Array.from(fileList).slice(0, slots);
    const baseUrls = urls;
    setUploadBusy(true);
    try {
      const settled = await Promise.allSettled(files.map((file) => uploadImage(file)));
      const ok: string[] = [];
      let failed = 0;
      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value) ok.push(result.value);
        else failed += 1;
      }
      if (ok.length > 0) {
        await commit(appendShowcaseUrls(baseUrls, ok));
      }
      if (failed > 0) {
        showToast(
          ok.length > 0
            ? `${ok.length} photo${ok.length === 1 ? '' : 's'} added; ${failed} failed.`
            : 'Could not upload photos.',
          'danger',
        );
      }
    } finally {
      setUploadBusy(false);
    }
  };

  const removeAt = (url: string) => {
    void commit(removeShowcaseUrl(urls, url));
  };

  const ownerChrome = canEdit ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        data-testid="showcase-add"
        disabled={busy || slots < 1}
        className="inline-flex items-center gap-0.5 px-1.5 text-meta font-emphasis text-accent disabled:opacity-40"
        onClick={() => setAddOpen(true)}
      >
        <PlusIcon width={12} height={12} aria-hidden />
        Add
      </button>
      <BrowseLayoutToggle
        layout={layout}
        testId="showcase-browse-layout"
        onToggle={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
      />
    </div>
  ) : (
    <BrowseLayoutToggle
      layout={layout}
      testId="showcase-browse-layout"
      onToggle={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
    />
  );

  const tile = (url: string, index: number, photoClass: string) => (
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
          disabled={busy}
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

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Showcase"
        headerAction={ownerChrome}
        panelClassName="min-h-[50dvh]"
      >
        <div data-testid="showcase-browse-sheet" className="flex min-h-0 flex-1 flex-col gap-2">
          {urls.length < 1 ? (
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
                  disabled={busy || slots < 1}
                  className="self-start text-meta font-emphasis text-accent disabled:opacity-40"
                  onClick={() => setAddOpen(true)}
                >
                  Add photos
                </button>
              ) : null}
            </div>
          ) : layout === 'feed' ? (
            <div className="flex flex-col gap-3" data-testid="showcase-browse-feed">
              {urls.map((url, index) => tile(url, index, 'aspect-[4/5] w-full object-cover'))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2" data-testid="showcase-browse-grid">
              {urls.map((url, index) => tile(url, index, 'aspect-[3/4] w-full object-cover'))}
            </div>
          )}
          {urls.length > 0 ? (
            <p className={cx('text-meta text-muted', layout === 'grid' ? 'pt-1' : null)}>
              {urls.length === 1 ? '1 photo' : `${urls.length} photos`}
              {busy ? ' · Saving…' : null}
            </p>
          ) : busy ? (
            <p className="text-xs text-muted" data-testid="showcase-busy">
              Saving Showcase…
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
              void onUploadFiles(event.target.files);
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
                disabled: busy || slots < 1,
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
                disabled: busy || slots < 1,
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
            busy={busy}
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
