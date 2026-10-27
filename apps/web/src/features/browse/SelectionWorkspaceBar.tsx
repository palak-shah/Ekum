import { createPortal } from 'react-dom';
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getPageOwnsBottomBand,
  getPageSelecting,
  subscribePageOwnsBottomBand,
  subscribePageSelecting,
} from '@/features/browse/selectionBottomBand';
import { shouldShowSelectionWorkspaceBar } from '@/features/browse/selectionWorkspaceBarVisibility';
import { selectionOwnShopVerbs } from '@/features/browse/selectionOwnShopVerbs';
import {
  shouldShowShopTradeDock,
  shopSelectedCount,
  companyIdFromPath,
} from '@/features/company/shopTradeDock';
import { useMyCompany } from '@/lib/queries';
import { DockIconButton } from '@/features/browse/BottomTradeDock';
import { prefetchSelectionPage } from '@/features/browse/prefetchSelectionPage';
import {
  clearResumeAfterAlbumPick,
  readResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { writeBrowseAlbumPick } from '@/features/browse/browseAlbumPick';
import { writeBrowseShortlist, type BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { clearSelection } from '@/features/browse/clearSelection';
import { addStagingToCart } from '@/features/browse/addStagingToCart';
import { OrderCollectionResolveSheet } from '@/features/browse/OrderCollectionResolveSheet';
import {
  collectionIdForPackOrder,
  packHandlerName,
} from '@/features/browse/packOrderSource';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import {
  entriesAsProducts,
  sellerIdForEntries,
  useShortlistOrderFlow,
} from '@/features/browse/useShortlistOrderFlow';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import {
  SELECTION_NEEDS_PUBLISHED_TOAST,
  selectionSkipToast,
  tradeableShortlistEntries,
} from '@/features/browse/selectionEligibility';
import { useToast } from '@/ui/Toast';
import { CartIcon, ChatIcon, PaperPlaneIcon } from '@/ui/icons';
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
 * Order opens How many on the staging pile — does not write the cart.
 * No staging badge on Add to cart — count stays on SelectAllFloat; cart count stays on header.
 */
export function SelectionWorkspaceBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const orderFlow = useShortlistOrderFlow();
  const me = useMyCompany();
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [orderResolveOpen, setOrderResolveOpen] = useState(false);
  const [qtyEntries, setQtyEntries] = useState<BrowseShortlistEntry[] | null>(null);
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

  useEffect(() => {
    if (!orderFlow.qtyOpen) setQtyEntries(null);
  }, [orderFlow.qtyOpen]);

  const companyIds = useMemo(
    () => selectionCompanyIds(shortlist.entries, albumPick.entries),
    [shortlist.entries, albumPick.entries],
  );
  const singleShopId = companyIds.length === 1 ? companyIds[0]! : null;
  const singleShopName = singleShopId
    ? selectionShopName(singleShopId, shortlist.entries, albumPick.entries)
    : '';
  const ownShopVerbs = selectionOwnShopVerbs({
    singleShopId,
    myCompanyId: me.data?.id,
  });

  const nothingSelected = total < 1;
  const orderSheetsOpen = orderResolveOpen || orderFlow.qtyOpen;
  const showDock =
    typeof document !== 'undefined' &&
    !readResumeAfterAlbumPick() &&
    visible;

  if (!showDock && !orderSheetsOpen) return null;

  const exitSelecting = () => {
    shortlist.setSelectMode(false);
    albumPick.setSelectMode(false);
  };

  const addToCart = () => {
    const { added, skipped = 0 } = addStagingToCart();
    exitSelecting();
    const skipNotice = selectionSkipToast(skipped, added);
    if (skipNotice) showToast(skipNotice);
    else if (added > 0) {
      showToast(added === 1 ? 'Added to cart' : `${added} added to cart`, 'success');
    }
  };

  const startOrder = () => {
    orderFlow.setError(null);
    if (albumPick.count > 0) {
      setOrderResolveOpen(true);
      return;
    }
    const tradeable = tradeableShortlistEntries(shortlist.entries);
    const skipped = shortlist.entries.length - tradeable.length;
    const notice = selectionSkipToast(skipped, tradeable.length);
    if (notice) showToast(notice);
    if (tradeable.length < 1) return;
    setQtyEntries(tradeable);
    orderFlow.setQtyOpen(true);
  };

  const openShare = () => {
    const tradeable = tradeableShortlistEntries(shortlist.entries);
    if (tradeable.length < 1 && albumPick.count < 1) {
      showToast(SELECTION_NEEDS_PUBLISHED_TOAST);
      return;
    }
    setShareOpen(true);
  };

  const qtySource = tradeableShortlistEntries(qtyEntries ?? shortlist.entries);
  const shareProducts = tradeableShortlistEntries(shortlist.entries);

  return (
    <>
      {showDock
        ? createPortal(
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
                      disabled={nothingSelected}
                      onClick={addToCart}
                    >
                      <CartIcon width={22} height={22} />
                    </DockIconButton>
                    <DockIconButton
                      testId="selection-workspace-message"
                      label="Message"
                      disabled={nothingSelected || ownShopVerbs.messageDisabled}
                      onClick={() => setMessageOpen(true)}
                    >
                      <ChatIcon width={22} height={22} />
                    </DockIconButton>
                    <DockIconButton
                      testId="selection-workspace-share"
                      label="Share"
                      disabled={nothingSelected}
                      onClick={openShare}
                    >
                      <PaperPlaneIcon width={22} height={22} />
                    </DockIconButton>
                  </div>
                  <button
                    type="button"
                    data-testid="selection-workspace-order"
                    disabled={nothingSelected}
                    onClick={startOrder}
                    className={cx(
                      'flex min-h-12 min-w-[5.75rem] shrink-0 items-center justify-center rounded-xl px-3 text-sm font-emphasis',
                      nothingSelected
                        ? 'border border-line bg-surface text-muted opacity-40'
                        : 'border border-accent bg-accent text-white',
                    )}
                  >
                    {ownShopVerbs.orderLabel}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {singleShopId ? (
        <SelectionMessageSheet
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          shopId={singleShopId}
          shopName={singleShopName}
          collections={albumPick.entries.map((entry) => ({
            collectionId: entry.collectionId,
            name: entry.name,
            image: entry.coverImage,
          }))}
          products={shareProducts.map((entry) => ({
            productId: entry.productId,
            name: entry.name,
            image: entry.thumbUrl,
          }))}
        />
      ) : null}
      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={albumPick.entries.map((entry) => ({
          collectionId: entry.collectionId,
          name: entry.name,
          image: entry.coverImage,
        }))}
        products={shareProducts.map((entry) => ({
          productId: entry.productId,
          name: entry.name,
          image: entry.thumbUrl,
        }))}
        onShared={() => clearSelection()}
      />
      <OrderCollectionResolveSheet
        intent="order"
        open={orderResolveOpen}
        onClose={() => setOrderResolveOpen(false)}
        albums={albumPick.entries}
        designCount={shortlist.count}
        existingShortlist={shortlist.entries}
        onResolved={({ shortlist: nextShortlist, remainingAlbums, navigateToCollectionId }) => {
          writeBrowseShortlist(nextShortlist);
          writeBrowseAlbumPick(remainingAlbums);
          setOrderResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('order');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          setQtyEntries(nextShortlist);
          orderFlow.setQtyOpen(true);
        }}
      />
      <HowManyEachSheet
        open={orderFlow.qtyOpen}
        onClose={() => {
          orderFlow.setQtyOpen(false);
          setQtyEntries(null);
        }}
        sellerId={sellerIdForEntries(qtySource)}
        products={entriesAsProducts(qtySource)}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        orderGoesToName={packHandlerName(qtySource)}
        sheetJob="order"
        onSendOrder={(lines, place) => {
          orderFlow.sendOrder(lines, {
            ...place,
            collectionId: collectionIdForPackOrder(qtySource),
          });
        }}
        onAskRates={() => undefined}
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
