import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CollectionCard, ExploreProductCard } from '@ekum/domain-types';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import { RepostSheet, type RepostSheetTarget } from '@/features/explore/RepostSheet';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { useToast } from '@/ui/Toast';
import { BookmarkIcon, ChatIcon, PaperPlaneIcon, RepostIcon } from '@/ui/icons';

/**
 * Instagram-placed icon row under Explore mosaics: left Repost · Message · Share,
 * Bookmark trailing right. Always show all four; gray out when not allowed
 * (own post, no forward, not trading, Selecting). Message = quick enquire (stay on feed).
 */
export function ExploreFeedActions({
  collection,
  product,
  selecting,
}: {
  collection?: CollectionCard;
  product?: ExploreProductCard;
  selecting?: boolean;
}) {
  const me = useMyCompany();
  const trade = useTradePresence();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const companyId = collection?.company.id ?? product?.company.id;
  const companyName = collection?.company.name ?? product?.company.name ?? '';
  const isOwn = Boolean(me.data?.id && companyId === me.data.id);
  if (!companyId) return null;

  const selectingMute = Boolean(selecting);
  const canRepost =
    !selectingMute &&
    !isOwn &&
    trade.trading &&
    (collection ? collection.allowForward !== false : product?.allowForward !== false);
  const canMessage = !selectingMute && !isOwn;
  const canShare = !selectingMute;
  const canBookmark = !selectingMute && !isOwn;

  const repostTarget: RepostSheetTarget | null = collection
    ? {
        kind: 'collection',
        collectionId: collection.id,
        name: collection.name,
        coverImage: collection.coverImage,
      }
    : product
      ? {
          kind: 'product',
          productId: product.id,
          name: product.name,
          companyId: product.company.id,
          thumbUrl: product.images[0] ?? null,
        }
      : null;

  const onBookmark = async () => {
    if (bookmarkBusy || !canBookmark) return;
    setBookmarkBusy(true);
    try {
      if (collection) {
        await api.post('/saved', { collectionId: collection.id });
      } else if (product) {
        await api.post('/saved', { productId: product.id });
      }
      void queryClient.invalidateQueries({ queryKey: ['saved'] });
      showToast('Bookmarked', 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not bookmark.', 'danger');
    } finally {
      setBookmarkBusy(false);
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between gap-2 pt-1.5 pb-0"
        data-testid="explore-feed-actions"
      >
        <div className="flex items-center gap-0.5" data-testid="explore-feed-actions-lead">
          <ActionIcon
            testId="explore-feed-repost"
            label="Repost"
            disabled={!canRepost}
            onClick={() => setRepostOpen(true)}
          >
            <RepostIcon width={24} height={24} />
          </ActionIcon>
          <ActionIcon
            testId="explore-feed-message"
            label="Message"
            disabled={!canMessage}
            onClick={() => setMessageOpen(true)}
          >
            <ChatIcon width={24} height={24} />
          </ActionIcon>
          <ActionIcon
            testId="explore-feed-share"
            label="Share"
            disabled={!canShare}
            onClick={() => setShareOpen(true)}
          >
            <PaperPlaneIcon width={24} height={24} />
          </ActionIcon>
        </div>
        <ActionIcon
          testId="explore-feed-bookmark"
          label="Bookmark"
          disabled={!canBookmark || bookmarkBusy}
          onClick={() => void onBookmark()}
        >
          <BookmarkIcon width={24} height={24} />
        </ActionIcon>
      </div>
      {shareOpen && canShare ? (
        <CatalogShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          collections={
            collection ? [{ collectionId: collection.id, name: collection.name }] : []
          }
          products={product ? [{ productId: product.id, name: product.name }] : []}
        />
      ) : null}
      {messageOpen && canMessage ? (
        <SelectionMessageSheet
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          shopId={companyId}
          shopName={companyName}
          collections={
            collection ? [{ collectionId: collection.id, name: collection.name }] : []
          }
          products={product ? [{ productId: product.id, name: product.name }] : []}
        />
      ) : null}
      {repostOpen && canRepost && repostTarget ? (
        <RepostSheet
          open={repostOpen}
          onClose={() => setRepostOpen(false)}
          target={repostTarget}
        />
      ) : null}
    </>
  );
}

function ActionIcon({
  testId,
  label,
  onClick,
  disabled,
  children,
}: {
  testId: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        onClick();
      }}
      className={
        disabled
          ? 'flex h-9 w-9 shrink-0 items-center justify-center text-muted opacity-40'
          : 'flex h-9 w-9 shrink-0 items-center justify-center text-ink'
      }
    >
      {children}
    </button>
  );
}
