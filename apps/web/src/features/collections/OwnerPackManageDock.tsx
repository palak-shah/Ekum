import { useState } from 'react';
import { Button, Sheet } from '@/ui/kit';
import { BottomTradeDock } from '@/features/browse/BottomTradeDock';
import { CartIcon, PaperPlaneIcon, TrashIcon } from '@/ui/icons';

const iconBtnClass =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface disabled:opacity-40';

/**
 * Owner album viewer: one Update collection button (opens Add designs · Add photos · Replace entire collection)
 * or Cart · Share · Delete + Remove while selecting.
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
  const [updateOpen, setUpdateOpen] = useState(false);
  const closeUpdate = () => setUpdateOpen(false);
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
            fullWidth
            disabled={busy}
            data-testid="owner-pack-update"
            onClick={() => setUpdateOpen(true)}
          >
            Update collection
          </Button>
          <Sheet
            open={updateOpen}
            onClose={closeUpdate}
            title="Update collection"
          >
            <div className="flex flex-col gap-2" data-testid="owner-pack-update-sheet">
              <Button
                fullWidth
                disabled={busy || !onAddDesigns}
                data-testid="owner-pack-add-designs"
                onClick={() => {
                  closeUpdate();
                  onAddDesigns?.();
                }}
              >
                Add designs
              </Button>
              <Button
                fullWidth
                disabled={busy || !onAddPhotos}
                data-testid="owner-pack-add-photos"
                onClick={() => {
                  closeUpdate();
                  onAddPhotos?.();
                }}
              >
                Add photos
              </Button>
              <Button
                fullWidth
                variant="secondary"
                disabled={busy || !onReplace}
                data-testid="owner-pack-replace"
                onClick={() => {
                  closeUpdate();
                  onReplace?.();
                }}
              >
                Replace entire collection
              </Button>
            </div>
          </Sheet>
        </>
      )}
    </BottomTradeDock>
  );
}
