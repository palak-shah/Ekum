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
import { BookmarkIcon, ChatIcon, RepostIcon, ShareIcon } from '@/ui/icons';

/**
 * Instagram-placed icon row under Explore mosaics: left Repost · Message · Share,
 * Bookmark trailing right. Message = quick enquire (stay on feed). Icon-only;
 * muted while Selecting.
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
  if (selecting || !companyId) return null;

  const canRepost =
    !isOwn &&
    trade.trading &&
    (collection ? collection.allowForward !== false : product?.allowForward !== false);

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
    if (bookmarkBusy) return;
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
          {canRepost ? (
            <ActionIcon
              testId="explore-feed-repost"
              label="Repost"
              onClick={() => setRepostOpen(true)}
            >
              <RepostIcon width={24} height={24} />
            </ActionIcon>
          ) : null}
          {!isOwn ? (
            <ActionIcon
              testId="explore-feed-message"
              label="Message"
              onClick={() => setMessageOpen(true)}
            >
              <ChatIcon width={24} height={24} />
            </ActionIcon>
          ) : null}
          <ActionIcon testId="explore-feed-share" label="Share" onClick={() => setShareOpen(true)}>
            <ShareIcon width={24} height={24} />
          </ActionIcon>
        </div>
        {!isOwn ? (
          <ActionIcon
            testId="explore-feed-bookmark"
            label="Bookmark"
            disabled={bookmarkBusy}
            onClick={() => void onBookmark()}
          >
            <BookmarkIcon width={24} height={24} />
          </ActionIcon>
        ) : (
          <span className="min-w-9" aria-hidden />
        )}
      </div>
      {shareOpen ? (
        <CatalogShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          collections={
            collection ? [{ collectionId: collection.id, name: collection.name }] : []
          }
          products={product ? [{ productId: product.id, name: product.name }] : []}
        />
      ) : null}
      {!isOwn && companyId ? (
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
      {canRepost && repostTarget ? (
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
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center text-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}
