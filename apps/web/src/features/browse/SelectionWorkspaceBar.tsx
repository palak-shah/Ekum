import { createPortal } from 'react-dom';
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getPageOwnsBottomBand,
  getPageSelecting,
  subscribePageOwnsBottomBand,
  subscribePageSelecting,
} from '@/features/browse/selectionBottomBand';
import { shouldShowSelectionWorkspaceBar } from '@/features/browse/selectionWorkspaceBarVisibility';
import {
  shouldShowShopTradeDock,
  shopSelectedCount,
  companyIdFromPath,
} from '@/features/company/shopTradeDock';
import { useMyCompany } from '@/lib/queries';
import { DockIconButton } from '@/features/browse/BottomTradeDock';
import { prefetchSelectionPage } from '@/features/browse/prefetchSelectionPage';
import { readResumeAfterAlbumPick } from '@/features/browse/resumeAfterAlbumPick';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { clearSelection } from '@/features/browse/clearSelection';
import { addStagingToCart } from '@/features/browse/addStagingToCart';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import { useToast } from '@/ui/Toast';
import { CartIcon, ChatIcon, ShareIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/** @deprecated floater height — dock uses BottomTradeDock. Kept for tests. */
export const SELECTION_FLOATER_MIN_H = 'min-h-10';

function selectionCompanyIds(
  shortlist: ReturnType<typeof useBrowseShortlist>['entries'],
  albums: ReturnType<typeof useBrowseAlbumPick>['entries'],
): string[] {
  return [
    ...new Set([
      ...albums.map((entry) => entry.companyId),
      ...shortlist.map((entry) => entry.companyId),
    ]),
  ].filter(Boolean);
}

function selectionShopName(
  shopId: string,
  shortlist: ReturnType<typeof useBrowseShortlist>['entries'],
  albums: ReturnType<typeof useBrowseAlbumPick>['entries'],
): string {
  return (
    albums.find((entry) => entry.companyId === shopId)?.companyName ||
    shortlist.find((entry) => entry.companyId === shopId)?.companyName ||
    ''
  );
}

/**
 * Explore Selecting dock: Add to cart · Message · Share + Order (right).
 * Dock Add to cart merges staging into the cart and clears selection. Header Cart opens cart.
 * No staging badge on Add to cart — count stays on SelectAllFloat; cart count stays on header.
 */
export function SelectionWorkspaceBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const me = useMyCompany();
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const shopId = companyIdFromPath(location.pathname);
  const ownShop = Boolean(shopId && me.data?.id && shopId === me.data.id);
  const shopDockUp = shouldShowShopTradeDock({
    isOwn: ownShop,
    shopSelectedCount: shopId
      ? shopSelectedCount(shortlist.entries, albumPick.entries, shopId)
      : 0,
  });
  const total = shortlist.count + albumPick.count;
  const pageDockUp = useSyncExternalStore(subscribePageOwnsBottomBand, getPageOwnsBottomBand);
  const pageSelecting = useSyncExternalStore(subscribePageSelecting, getPageSelecting);

  const visible = shouldShowSelectionWorkspaceBar(location.pathname, total, {
    shopDockUp,
    pageDockUp,
    ownShop,
    pageSelecting,
  });

  useEffect(() => {
    if (total > 0) prefetchSelectionPage();
  }, [total]);

  const companyIds = useMemo(
    () => selectionCompanyIds(shortlist.entries, albumPick.entries),
    [shortlist.entries, albumPick.entries],
  );
  const singleShopId = companyIds.length === 1 ? companyIds[0]! : null;
  const singleShopName = singleShopId
    ? selectionShopName(singleShopId, shortlist.entries, albumPick.entries)
    : '';

  if (typeof document === 'undefined') return null;
  if (readResumeAfterAlbumPick()) return null;
  if (!visible) return null;

  const exitSelecting = () => {
    shortlist.setSelectMode(false);
    albumPick.setSelectMode(false);
  };

  const addToCart = () => {
    const { added } = addStagingToCart();
    exitSelecting();
    if (added > 0) {
      showToast(added === 1 ? 'Added to cart' : `${added} added to cart`, 'success');
    }
  };

  const startOrder = () => {
    addStagingToCart();
    exitSelecting();
    startTransition(() => navigate('/selection', { state: { openOrder: true } }));
  };

  return (
    <>
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md"
          data-testid="selection-workspace-bar"
        >
          <div className="pointer-events-auto border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
            <div
              className="flex items-stretch gap-2"
              data-testid="selection-workspace-actions"
            >
              <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
                <DockIconButton
                  testId="selection-workspace-cart"
                  label="Add to cart"
                  onClick={addToCart}
                >
                  <CartIcon width={22} height={22} />
                </DockIconButton>
                <DockIconButton
                  testId="selection-workspace-message"
                  label="Message"
                  disabled={!singleShopId}
                  onClick={() => setMessageOpen(true)}
                >
                  <ChatIcon width={22} height={22} />
                </DockIconButton>
                <DockIconButton
                  testId="selection-workspace-share"
                  label="Share"
                  onClick={() => setShareOpen(true)}
                >
                  <ShareIcon width={22} height={22} />
                </DockIconButton>
              </div>
              <button
                type="button"
                data-testid="selection-workspace-order"
                onClick={startOrder}
                className={cx(
                  'flex min-h-12 min-w-[5.75rem] shrink-0 items-center justify-center rounded-xl px-4',
                  'border border-accent bg-accent text-sm font-bold text-white',
                )}
              >
                Order
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {singleShopId ? (
        <SelectionMessageSheet
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          shopId={singleShopId}
          shopName={singleShopName}
          collections={albumPick.entries.map((entry) => ({
            collectionId: entry.collectionId,
            name: entry.name,
          }))}
          products={shortlist.entries.map((entry) => ({
            productId: entry.productId,
            name: entry.name,
          }))}
        />
      ) : null}
      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={albumPick.entries.map((entry) => ({
          collectionId: entry.collectionId,
          name: entry.name,
        }))}
        products={shortlist.entries.map((entry) => ({
          productId: entry.productId,
          name: entry.name,
        }))}
        onShared={() => clearSelection()}
      />
    </>
  );
}

/** True when SelectionWorkspaceBar dock is the bottom owner (hide app nav). */
export function selectionWorkspaceDockUp(
  pathname: string,
  total: number,
  options?: {
    shopDockUp?: boolean;
    pageDockUp?: boolean;
    ownShop?: boolean;
    pageSelecting?: boolean;
  },
): boolean {
  if (readResumeAfterAlbumPick()) return false;
  return shouldShowSelectionWorkspaceBar(pathname, total, options);
}
