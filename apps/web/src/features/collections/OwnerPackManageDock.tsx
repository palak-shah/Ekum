import { Button } from '@/ui/kit';
import { BottomTradeDock } from '@/features/browse/BottomTradeDock';

/**
 * Owner album viewer: Add · Replace (idle) or Delete · Remove (selecting).
 * Edit idle: Update only (Add designs lives on the page). Selecting same as viewer.
 * Replace lives in ⋯.
 */
export function OwnerPackManageDock({
  selecting,
  busy = false,
  canDelete,
  canRemove,
  onAdd,
  onReplace,
  onDelete,
  onRemove,
  onUpdate,
  updatePending = false,
  updateDisabled = false,
}: {
  selecting: boolean;
  busy?: boolean;
  canDelete: boolean;
  canRemove: boolean;
  onAdd: () => void;
  onReplace: () => void;
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
          {canDelete ? (
            <Button
              variant="secondary"
              fullWidth
              className="text-danger"
              disabled={busy}
              data-testid="owner-pack-delete"
              onClick={onDelete}
            >
              Delete
            </Button>
          ) : null}
          <Button
            variant="secondary"
            fullWidth
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
            data-testid="owner-pack-add"
            onClick={onAdd}
          >
            Add designs
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            data-testid="owner-pack-replace"
            onClick={onReplace}
          >
            Replace whole collection
          </Button>
        </>
      )}
    </BottomTradeDock>
  );
}
