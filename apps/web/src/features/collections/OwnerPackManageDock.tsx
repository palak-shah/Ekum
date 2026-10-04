import { Button } from '@/ui/kit';
import { BottomTradeDock } from '@/features/browse/BottomTradeDock';

/**
 * Owner album / Edit: Add · Replace (idle) or Remove · Delete (selecting).
 * Delete sits last — severe action (ui-quality-bar).
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
}: {
  selecting: boolean;
  busy?: boolean;
  canDelete: boolean;
  canRemove: boolean;
  onAdd: () => void;
  onReplace: () => void;
  onDelete: () => void;
  onRemove: () => void;
}) {
  return (
    <BottomTradeDock testId="owner-pack-manage-dock" aboveAppNav={false}>
      {selecting ? (
        <>
          <Button
            variant="secondary"
            fullWidth
            disabled={!canRemove || busy}
            data-testid="owner-pack-remove"
            onClick={onRemove}
          >
            Remove from collection
          </Button>
          <Button
            variant="secondary"
            fullWidth
            className="text-danger"
            disabled={!canDelete || busy}
            data-testid="owner-pack-delete"
            onClick={onDelete}
          >
            Delete
          </Button>
        </>
      ) : (
        <>
          <Button
            fullWidth
            disabled={busy}
            data-testid="owner-pack-add"
            onClick={onAdd}
          >
            Add new designs
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
