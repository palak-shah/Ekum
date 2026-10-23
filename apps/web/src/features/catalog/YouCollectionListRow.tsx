import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CollectionStatus, MEDIA_VARIANT, type CollectionView } from '@ekum/domain-types';
import { collectionAlbumOpenTarget } from '@/features/collections/collectionAlbumTileModel';
import { collectionOwnerSourceLine } from '@/features/catalog/collectionOwnerSourceLine';
import { displayCollectionName } from '@/features/catalog/collectionCreateHelpers';
import {
  inboxSwipeAxis,
  inboxSwipeReveal,
} from '@/features/chats/inboxRowSwipe';
import { CoverImage } from '@/ui/cards';
import { highlightSearchText } from '@/ui/highlightMatch';
import { MoreHorizontalIcon, PaperPlaneIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';

/** More + Share wells — match full row height, no spill into neighbors. */
const ACTION_W = 72;
const OPEN_PX = ACTION_W * 2;
const OPEN_THRESHOLD = ACTION_W;

function isDraft(status: string): boolean {
  return status === CollectionStatus.Draft || status === CollectionStatus.Ready;
}

function settleSwipe(deltaX: number): number {
  return inboxSwipeReveal(deltaX) >= OPEN_THRESHOLD ? -OPEN_PX : 0;
}

export function YouCollectionListRow({
  collection,
  selecting,
  selected,
  actionFocus = false,
  swipeOpen,
  onSwipeOpen,
  onSwipeClose,
  onToggle,
  onLongSelect,
  onMore,
  onShare,
  highlightQuery = '',
}: {
  collection: CollectionView;
  selecting: boolean;
  selected: boolean;
  /** Tint while this row’s More menu or Share sheet is open. */
  actionFocus?: boolean;
  swipeOpen: boolean;
  onSwipeOpen: () => void;
  onSwipeClose: () => void;
  onToggle: () => void;
  onLongSelect: () => void;
  onMore: () => void;
  onShare: () => void;
  highlightQuery?: string;
}) {
  const navigate = useNavigate();
  const target = collectionAlbumOpenTarget({
    surface: 'library',
    id: collection.id,
    status: collection.status,
  });
  const source = collectionOwnerSourceLine(collection.companyId, collection.memberShops ?? []);
  const draft = isDraft(collection.status);
  const archived = collection.status === CollectionStatus.Archived;
  const meta = [source, archived ? 'Archived' : null].filter(Boolean).join(' · ');
  const thumb = collection.libraryThumb ?? collection.coverImage ?? null;
  const rowRef = useRef<HTMLAnchorElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startDrag = useRef(0);
  const dragXRef = useRef(0);
  const axisRef = useRef<'x' | 'y' | null>(null);
  const didSwipeRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const setDrag = (next: number) => {
    const clamped = Math.min(0, Math.max(-OPEN_PX, next));
    dragXRef.current = clamped;
    setDragX(clamped);
  };

  useEffect(() => {
    if (selecting || !swipeOpen) setDrag(0);
  }, [swipeOpen, selecting]);

  const reveal = selecting ? 0 : Math.min(OPEN_PX, inboxSwipeReveal(dragX));
  const actionsVisible = reveal > 4;

  const shareButton = (
    <button
      type="button"
      data-testid="you-collection-share"
      aria-label="Share"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-accent hover:bg-accent/10"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onShare();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <PaperPlaneIcon width={20} height={20} />
    </button>
  );

  const body = (
    <>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <CoverImage src={thumb} alt={displayCollectionName(collection.name)} className="h-16 w-16" priority variant={MEDIA_VARIANT.Thumbnail1} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-emphasis tracking-tight text-ink">
          {highlightSearchText(displayCollectionName(collection.name), highlightQuery)}
        </p>
        {meta || draft ? (
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
            {meta ? <span className="truncate">{meta}</span> : null}
            {draft ? (
              <span
                data-testid="you-collection-draft-chip"
                className="shrink-0 rounded-full bg-foam px-1.5 py-0.5 text-[10px] font-emphasis tracking-tight text-ink"
              >
                Draft
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      {!selecting && !actionsVisible ? shareButton : null}
    </>
  );

  const rowClass = cx(
    LONG_PRESS_SURFACE_CLASS,
    'flex w-full items-center gap-3 px-1 py-2 text-left',
    selected || actionFocus
      ? 'rounded-xl border border-accent bg-accent/5'
      : 'border border-transparent bg-canvas',
  );

  const longPress = useLongPress(() => onLongSelect());

  if (selecting) {
    return (
      <button
        type="button"
        data-testid={`you-collection-row-${collection.id}`}
        aria-pressed={selected}
        className={rowClass}
        onClick={onToggle}
      >
        {body}
      </button>
    );
  }

  const finishSwipe = (delta: number) => {
    const settled = settleSwipe(delta);
    setDrag(settled);
    setDragging(false);
    if (settled < 0) onSwipeOpen();
    else onSwipeClose();
  };

  return (
    <div
      className="relative isolate overflow-hidden touch-pan-y"
      data-testid={`you-collection-swipe-${collection.id}`}
    >
      <div
        className={cx(
          'absolute inset-y-0 right-0 z-0 flex',
          !actionsVisible && 'pointer-events-none opacity-0',
        )}
        style={{ width: OPEN_PX }}
        aria-hidden={!actionsVisible}
      >
        <button
          type="button"
          tabIndex={actionsVisible ? 0 : -1}
          data-testid="you-collection-swipe-more"
          aria-label="More"
          className="flex h-full w-[72px] shrink-0 flex-col items-center justify-center gap-0.5 bg-foam text-ink"
          onClick={() => {
            setDrag(0);
            onSwipeClose();
            onMore();
          }}
        >
          <MoreHorizontalIcon width={22} height={22} />
          <span className="text-[11px] font-emphasis tracking-tight">More</span>
        </button>
        <button
          type="button"
          tabIndex={actionsVisible ? 0 : -1}
          data-testid="you-collection-swipe-share"
          aria-label="Share"
          className="flex h-full w-[72px] shrink-0 flex-col items-center justify-center bg-accent text-white"
          onClick={() => {
            setDrag(0);
            onSwipeClose();
            onShare();
          }}
        >
          <PaperPlaneIcon width={22} height={22} />
        </button>
      </div>
      <Link
        ref={rowRef as RefObject<HTMLAnchorElement>}
        to={target.href}
        state={target.state}
        data-testid={`you-collection-row-${collection.id}`}
        className={cx(rowClass, 'relative z-[1] touch-pan-y')}
        style={{
          transform: `translateX(${-reveal}px)`,
          transition: dragging ? undefined : 'transform 160ms ease-out',
        }}
        onPointerDown={(event) => {
          startX.current = event.clientX;
          startY.current = event.clientY;
          startDrag.current = dragXRef.current;
          axisRef.current = null;
          didSwipeRef.current = false;
          longPress.onPointerDown();
        }}
        onPointerMove={(event) => {
          if (startX.current == null || startY.current == null) return;
          const dx = event.clientX - startX.current;
          const dy = event.clientY - startY.current;
          if (axisRef.current == null) {
            axisRef.current = inboxSwipeAxis(dx, dy);
            if (axisRef.current === 'x') {
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                /* desktop */
              }
              longPress.onPointerCancel();
              setDragging(true);
              onSwipeOpen();
            }
          }
          if (axisRef.current !== 'x') return;
          didSwipeRef.current = true;
          event.preventDefault();
          setDrag(startDrag.current + dx);
        }}
        onPointerUp={() => {
          if (axisRef.current === 'x') finishSwipe(dragXRef.current);
          else setDragging(false);
          startX.current = null;
          startY.current = null;
          axisRef.current = null;
          longPress.onPointerUp();
        }}
        onPointerCancel={() => {
          startX.current = null;
          startY.current = null;
          axisRef.current = null;
          finishSwipe(dragXRef.current);
          longPress.onPointerCancel();
        }}
        onContextMenu={longPress.onContextMenu}
        onClickCapture={(event) => {
          if (didSwipeRef.current || reveal > 8) {
            event.preventDefault();
            event.stopPropagation();
            if (!didSwipeRef.current) {
              setDrag(0);
              onSwipeClose();
            }
            didSwipeRef.current = false;
            return;
          }
          longPress.onClickCapture(event);
        }}
        onClick={(event) => {
          if (target.state) {
            event.preventDefault();
            navigate(target.href, { state: target.state });
          }
        }}
      >
        {body}
      </Link>
    </div>
  );
}
