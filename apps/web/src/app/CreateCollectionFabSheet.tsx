import { Sheet } from '@/ui/kit';
import {
  CREATE_FAB_MY_COLLECTIONS_HREF,
  CREATE_FAB_NEW_COLLECTION_HREF,
} from './createFabIntent';

const ROW =
  'rounded-2xl border border-line px-4 py-3.5 text-left hover:bg-foam';

export function CreateCollectionFabSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (href: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Collection">
      <div className="flex flex-col gap-2 pb-4">
        <button
          type="button"
          data-testid="create-fab-new-collection"
          className={ROW}
          onClick={() => {
            onClose();
            onPick(CREATE_FAB_NEW_COLLECTION_HREF);
          }}
        >
          <p className="text-sm font-bold text-ink">Create new collection</p>
          <p className="mt-0.5 text-xs text-muted">Start a new collection</p>
        </button>
        <button
          type="button"
          data-testid="create-fab-update-collection"
          className={ROW}
          onClick={() => {
            onClose();
            onPick(CREATE_FAB_MY_COLLECTIONS_HREF);
          }}
        >
          <p className="text-sm font-bold text-ink">Update existing collection</p>
          <p className="mt-0.5 text-xs text-muted">Add or change designs in a collection</p>
        </button>
      </div>
    </Sheet>
  );
}
