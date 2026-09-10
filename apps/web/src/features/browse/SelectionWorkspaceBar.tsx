import { createPortal } from 'react-dom';
import { useEffect, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { shouldShowSelectionWorkspaceBar } from '@/features/browse/selectionWorkspaceBarVisibility';
import { prefetchSelectionPage } from '@/features/browse/prefetchSelectionPage';
import { readResumeAfterAlbumPick } from '@/features/browse/resumeAfterAlbumPick';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';

/**
 * Compact floater: small chip with count + View. No trade verbs.
 * Hidden on `/selection`, open chat threads, and My Catalog root.
 * Hidden while album Pick-designs resume CTA owns the band above nav.
 */
export function SelectionWorkspaceBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, startTransition] = useTransition();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const total = shortlist.count + albumPick.count;

  useEffect(() => {
    if (total > 0) prefetchSelectionPage();
  }, [total]);

  if (typeof document === 'undefined') return null;
  if (readResumeAfterAlbumPick()) return null;
  if (!shouldShowSelectionWorkspaceBar(location.pathname, total)) return null;

  const thumbs = [
    ...albumPick.entries.slice(0, 2).map((entry) => ({
      key: `c-${entry.collectionId}`,
      url: entry.coverImage,
      name: entry.name,
    })),
    ...shortlist.entries.slice(0, 2).map((entry) => ({
      key: `p-${entry.productId}`,
      url: entry.thumbUrl,
      name: entry.name,
    })),
  ].slice(0, 2);

  const countLabel = total === 1 ? '1 in selection' : `${total} in selection`;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[5.25rem] z-30 flex justify-center px-4"
      data-testid="selection-workspace-bar"
    >
      <button
        type="button"
        className="pointer-events-auto flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 shadow-[var(--shadow-soft)]"
        onClick={() => startTransition(() => navigate('/selection'))}
        aria-label={`${countLabel}. Open Your selection`}
      >
        <div className="flex shrink-0 -space-x-1.5">
          {thumbs.map((thumb) =>
            thumb.url ? (
              <img
                key={thumb.key}
                src={thumb.url}
                alt=""
                className="h-6 w-6 rounded-full border border-canvas object-cover"
              />
            ) : (
              <span
                key={thumb.key}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-canvas bg-foam text-[9px] font-bold text-muted"
              >
                {thumb.name.slice(0, 1).toUpperCase()}
              </span>
            ),
          )}
        </div>
        <span className="min-w-0 truncate text-xs font-semibold text-ink">{countLabel}</span>
        <span className="shrink-0 text-xs font-bold text-accent">View</span>
      </button>
    </div>,
    document.body,
  );
}
