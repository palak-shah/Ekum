import { Button } from '@/ui/kit';

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
    <div
      data-testid="chats-inbox-dock"
      className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-md gap-2">
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
      </div>
    </div>
  );
}
