import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { CollectionCard, ExploreProductCard } from '@ekum/domain-types';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import {
  ALREADY_REPOSTED_TOAST,
  REPOST_NO_PERMISSION,
  canExploreRepost,
  exploreRepostEligibleCount,
} from '@/features/browse/curateCheck';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import { RepostSheet, type RepostSheetTarget } from '@/features/explore/RepostSheet';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { useToast } from '@/ui/Toast';
import { cx } from '@/ui/kit';
import {
  BookmarkIcon,
  ChatIcon,
  PaperPlaneIcon,
  RepostDoneIcon,
  RepostIcon,
} from '@/ui/icons';

/**
 * Instagram-placed icon row under Explore mosaics: left Repost · Message · Share,
 * Bookmark trailing right. Always show all four; gray out when not allowed
 * (own → Message + Repost; peer already reposted → done icon at full ink;
 * no forward / not trading → Repost). Selecting does **not** mute these —
 * mosaic taps still toggle pick; icons stay usable.
 * Message = quick enquire (stay on feed).
 */
/** Quiet slide marks for a multi-photo Explore post. Centered on the icon row. */
export function ExploreFeedPhotoDots({
  count,
  index,
}: {
  count: number;
  index: number;
}) {
  if (count < 2) return null;
  const safe = Math.min(Math.max(index, 0), count - 1);
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1"
      data-testid="explore-feed-photo-dots"
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cx('h-1 w-1 rounded-full', i === safe ? 'bg-ink' : 'bg-ink/30')}
        />
      ))}
    </div>
  );
}

export function ExploreFeedActions({
  collection,
  product,
  photoCount = 0,
  photoIndex = 0,
}: {
  collection?: CollectionCard;
  product?: ExploreProductCard;
  /** @deprecated Ignored — Selecting no longer grays feed actions. */
  selecting?: boolean;
  /** Slides in the post photo strip. Dots show when this is 2 or more. */
  photoCount?: number;
  photoIndex?: number;
}) {
  const me = useMyCompany();
  const trade = useTradePresence();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  /** Flip done icon immediately after a successful Repost (before home refetch). */
  const [markedReposted, setMarkedReposted] = useState(false);

  const companyId = collection?.company.id ?? product?.company.id;
  const companyName = collection?.company.name ?? product?.company.name ?? '';
  const isOwn = Boolean(me.data?.id && companyId === me.data.id);
  const viewerReposted =
    markedReposted ||
    Boolean(collection?.viewerReposted ?? product?.viewerReposted);
  if (!companyId) return null;

  const eligibleCount = collection
    ? exploreRepostEligibleCount(collection)
    : exploreRepostEligibleCount(product ?? { allowForward: true });
  const canRepost = canExploreRepost({
    isOwn,
    viewerReposted,
    trading: trade.trading,
    eligibleCount,
  });
  const canMessage = !isOwn;
  const canShare = true;
  const canBookmark = true;
  const showPermissionHint = !isOwn && !viewerReposted && trade.trading && eligibleCount < 1;

  const repostTarget = useMemo<RepostSheetTarget | null>(() => {
    if (collection) {
      return {
        kind: 'collection',
        collectionId: collection.id,
        name: collection.name,
        coverImage: collection.coverImage,
      };
    }
    if (product) {
      return {
        kind: 'product',
        productId: product.id,
        name: product.name,
        companyId: product.company.id,
        thumbUrl: product.images[0] ?? null,
      };
    }
    return null;
  }, [
    collection?.id,
    collection?.name,
    collection?.coverImage,
    product?.id,
    product?.name,
    product?.company.id,
    product?.images,
  ]);

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
        className="relative flex items-center justify-between gap-2 pt-1.5 pb-0"
        data-testid="explore-feed-actions"
      >
        <div className="flex items-center gap-0.5" data-testid="explore-feed-actions-lead">
          {viewerReposted && !isOwn ? (
            <ActionIcon
              testId="explore-feed-repost"
              label="Reposted"
              tone="done"
              onClick={() => showToast(ALREADY_REPOSTED_TOAST)}
            >
              <RepostDoneIcon width={24} height={24} />
            </ActionIcon>
          ) : (
            <ActionIcon
              testId="explore-feed-repost"
              label="Repost"
              disabled={!canRepost}
              hint={showPermissionHint ? REPOST_NO_PERMISSION : undefined}
              onDisabledActivate={
                showPermissionHint ? () => showToast(REPOST_NO_PERMISSION) : undefined
              }
              onClick={() => setRepostOpen(true)}
            >
              <RepostIcon width={24} height={24} />
            </ActionIcon>
          )}
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
        <ExploreFeedPhotoDots count={photoCount} index={photoIndex} />
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
            collection
              ? [
                  {
                    collectionId: collection.id,
                    name: collection.name,
                    image: collection.coverImage ?? collection.previewImages[0] ?? null,
                  },
                ]
              : []
          }
          products={
            product
              ? [
                  {
                    productId: product.id,
                    name: product.name,
                    image: product.images[0] ?? null,
                  },
                ]
              : []
          }
        />
      ) : null}
      {repostOpen && canRepost && repostTarget ? (
        <RepostSheet
          open={repostOpen}
          onClose={() => setRepostOpen(false)}
          onReposted={() => setMarkedReposted(true)}
          target={repostTarget}
        />
      ) : null}
    </>
  );
}

function isFineHoverPointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function ActionIcon({
  testId,
  label,
  onClick,
  disabled,
  hint,
  onDisabledActivate,
  tone,
  children,
}: {
  testId: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
  onDisabledActivate?: () => void;
  /** Done = full ink, not gray. */
  tone?: 'done';
  children: ReactNode;
}) {
  const done = tone === 'done';
  const nativeDisabled = Boolean(disabled && !hint && !onDisabledActivate);
  const [hintOpen, setHintOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!hintOpen || !hint) {
      setPos(null);
      return;
    }
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 16);
    let left = r.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - 8 - width;
    if (left < 8) left = 8;
    setPos({ top: r.bottom + 6, left, width });
  }, [hintOpen, hint]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-testid={testId}
        data-repost={done ? 'done' : undefined}
        aria-label={label}
        aria-disabled={disabled || undefined}
        disabled={nativeDisabled}
        title={disabled && hint ? hint : undefined}
        onMouseEnter={() => {
          if (disabled && hint && isFineHoverPointer()) setHintOpen(true);
        }}
        onMouseLeave={() => setHintOpen(false)}
        onFocus={() => {
          if (disabled && hint && isFineHoverPointer()) setHintOpen(true);
        }}
        onBlur={() => setHintOpen(false)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (disabled) {
            if (hint && !isFineHoverPointer()) onDisabledActivate?.();
            return;
          }
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
      {hintOpen && hint && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="tooltip"
              data-testid={`${testId}-hint`}
              className="fixed z-[85] rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-body leading-snug text-muted shadow-[var(--shadow-soft)]"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              {hint}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
