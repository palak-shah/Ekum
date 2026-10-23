import { Button } from '@/ui/kit';
import { BottomTradeDock } from '@/features/browse/BottomTradeDock';

export function ChatsInboxDock({
  count,
  pending,
  onArchive,
  onClear,
  onDelete,
}: {
  count: number;
  pending?: boolean;
  onArchive: () => void;
  onClear: () => void;
  onDelete: () => void;
}) {
  if (count < 1) return null;

  return (
    <BottomTradeDock testId="chats-inbox-dock" aboveAppNav>
      <Button
        variant="secondary"
        className="min-w-0 flex-1"
        disabled={pending}
        data-testid="chats-inbox-archive"
        onClick={onArchive}
      >
        Archive
      </Button>
      <Button
        variant="secondary"
        className="min-w-0 flex-1"
        disabled={pending}
        data-testid="chats-inbox-clear"
        onClick={onClear}
      >
        Clear
      </Button>
      <Button
        variant="danger"
        className="min-w-0 flex-1"
        disabled={pending}
        data-testid="chats-inbox-delete"
        onClick={onDelete}
      >
        Delete
      </Button>
    </BottomTradeDock>
  );
}
