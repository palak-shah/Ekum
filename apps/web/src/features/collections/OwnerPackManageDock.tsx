import { Button } from '@/ui/kit';
import { BottomTradeDock } from '@/features/browse/BottomTradeDock';
import { CartIcon, PaperPlaneIcon, TrashIcon } from '@/ui/icons';

const iconBtnClass =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface disabled:opacity-40';

/**
 * Owner album viewer: Designs · Photos · Replace (idle, one row) or Cart · Share · Delete + Remove (selecting).
 * Edit idle: Update only (membership / Add live on the album, not Edit).
 */
export function OwnerPackManageDock({
  selecting,
  busy = false,
  canAddToCart = false,
  canShare = false,
  canDelete,
  canRemove,
  onAddDesigns,
  onAddPhotos,
  onReplace,
  onAddToCart,
  onShare,
  onDelete,
  onRemove,
  onUpdate,
  updatePending = false,
  updateDisabled = false,
}: {
  selecting: boolean;
  busy?: boolean;
  canAddToCart?: boolean;
  canShare?: boolean;
  canDelete: boolean;
  canRemove: boolean;
  onAddDesigns?: () => void;
  onAddPhotos?: () => void;
  onReplace?: () => void;
  onAddToCart?: () => void;
  onShare?: () => void;
  onDelete: () => void;
  onRemove: () => void;
  onUpdate?: () => void;
  updatePending?: boolean;
  updateDisabled?: boolean;
}) {
  return (
    <BottomTradeDock testId="owner-pack-manage-dock" aboveAppNav={false}>
      {selecting ? (
        <>
          {onAddToCart ? (
            <button
              type="button"
              aria-label="Add to cart"
              disabled={!canAddToCart || busy}
              data-testid="owner-pack-cart"
              onClick={onAddToCart}
              className={`${iconBtnClass} text-accent`}
            >
              <CartIcon width={22} height={22} />
            </button>
          ) : null}
          {onShare ? (
            <button
              type="button"
              aria-label="Share"
              disabled={!canShare || busy}
              data-testid="owner-pack-share"
              onClick={onShare}
              className={`${iconBtnClass} text-accent`}
            >
              <PaperPlaneIcon width={22} height={22} />
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              aria-label="Delete"
              disabled={busy}
              data-testid="owner-pack-delete"
              onClick={onDelete}
              className={`${iconBtnClass} text-danger`}
            >
              <TrashIcon width={22} height={22} />
            </button>
          ) : null}
          <Button
            className="min-w-0 flex-1"
            disabled={!canRemove || busy}
            data-testid="owner-pack-remove"
            onClick={onRemove}
          >
            Remove from this collection
          </Button>
        </>
      ) : onUpdate ? (
        <Button
          fullWidth
          disabled={updateDisabled || busy}
          data-testid="collection-editor-update"
          onClick={onUpdate}
        >
          {updatePending ? 'Updating…' : 'Update collection'}
        </Button>
      ) : (
        <>
          <Button
            className="min-w-0 flex-1"
            disabled={busy || !onAddDesigns}
            data-testid="owner-pack-add-designs"
            onClick={onAddDesigns}
          >
            Designs
          </Button>
          <Button
            className="min-w-0 flex-1"
            disabled={busy || !onAddPhotos}
            data-testid="owner-pack-add-photos"
            onClick={onAddPhotos}
          >
            Photos
          </Button>
          <Button
            variant="secondary"
            className="min-w-0 flex-1"
            disabled={busy || !onReplace}
            data-testid="owner-pack-replace"
            onClick={onReplace}
          >
            Replace
          </Button>
        </>
      )}
    </BottomTradeDock>
  );
}
