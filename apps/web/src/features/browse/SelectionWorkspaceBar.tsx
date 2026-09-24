import { createPortal } from 'react-dom';
import { useEffect, useSyncExternalStore, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { shouldShowSelectionWorkspaceBar } from '@/features/browse/selectionWorkspaceBarVisibility';
import {
  shouldShowShopTradeDock,
  shopSelectedCount,
  companyIdFromPath,
} from '@/features/company/shopTradeDock';
import { useMyCompany } from '@/lib/queries';
import { prefetchSelectionPage } from '@/features/browse/prefetchSelectionPage';
import { readResumeAfterAlbumPick } from '@/features/browse/resumeAfterAlbumPick';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  getChatsInboxSelecting,
  subscribeChatsInboxSelect,
} from '@/features/chats/chatsInboxSelect';

/**
 * Compact floater: count + thumbs open the pile; Order starts the same path
 * as Your selection. Hidden on `/selection`, open chat threads, and My Catalog root.
 * Hidden while album Pick-designs resume CTA owns the band above nav.
 */
export function SelectionWorkspaceBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, startTransition] = useTransition();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const me = useMyCompany();
  const shopId = companyIdFromPath(location.pathname);
  const shopDockUp = shouldShowShopTradeDock({
    isOwn: Boolean(shopId && me.data?.id && shopId === me.data.id),
    shopSelectedCount: shopId
      ? shopSelectedCount(shortlist.entries, albumPick.entries, shopId)
      : 0,
  });
  const total = shortlist.count + albumPick.count;
  const chatsSelecting = useSyncExternalStore(subscribeChatsInboxSelect, getChatsInboxSelecting);

  useEffect(() => {
    if (total > 0) prefetchSelectionPage();
  }, [total]);

  if (typeof document === 'undefined') return null;
  if (readResumeAfterAlbumPick()) return null;
  if (!shouldShowSelectionWorkspaceBar(location.pathname, total, { shopDockUp })) return null;
  if (location.pathname === '/chats' && chatsSelecting) return null;

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
  const openPile = () => startTransition(() => navigate('/selection'));
  const startOrder = () =>
    startTransition(() => navigate('/selection', { state: { openOrder: true } }));

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[5.25rem] z-30 flex justify-center px-4"
      data-testid="selection-workspace-bar"
    >
      <div className="pointer-events-auto flex max-w-[min(100%,18rem)] items-stretch overflow-hidden rounded-full border border-ink/25 bg-surface shadow-[0_2px_12px_rgb(26_23_20/0.18)]">
        <button
          type="button"
          data-testid="selection-workspace-view"
          className="flex min-w-0 items-center gap-1.5 py-[5px] pl-[5px] pr-2.5"
          onClick={openPile}
          aria-label={`${countLabel}. Open Your selection`}
        >
          <div className="flex shrink-0 -space-x-1.5">
            {thumbs.map((thumb) =>
              thumb.url ? (
                <img
                  key={thumb.key}
                  src={thumb.url}
                  alt=""
                  className="h-[25px] w-[25px] rounded-full border border-ink/15 object-cover"
                />
              ) : (
                <span
                  key={thumb.key}
                  className="flex h-[25px] w-[25px] items-center justify-center rounded-full border border-ink/15 bg-foam text-[9px] font-bold text-ink"
                >
                  {thumb.name.slice(0, 1).toUpperCase()}
                </span>
              ),
            )}
          </div>
          <span className="min-w-0 truncate text-xs font-semibold text-ink">{countLabel}</span>
        </button>
        <button
          type="button"
          data-testid="selection-workspace-order"
          className="shrink-0 border-l border-ink/15 px-3 text-xs font-bold text-accent"
          onClick={startOrder}
        >
          Order
        </button>
      </div>
    </div>,
    document.body,
  );
}
