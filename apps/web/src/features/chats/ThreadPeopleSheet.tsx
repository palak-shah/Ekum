import type { TeamMemberView, ThreadPersonView } from '@ekum/domain-types';
import { Button, Sheet } from '@/ui/kit';
import { TeamPersonRow } from '@/features/chats/TeamPersonRow';

export type ExistingChatPrompt = {
  threadId: string;
  title: string | null;
};

export function ThreadPeopleSheet({
  open,
  onClose,
  people,
  team,
  busy,
  onAdd,
  onRemove,
  existingChat,
  onOpenExisting,
}: {
  open: boolean;
  onClose: () => void;
  people: ThreadPersonView[];
  team: TeamMemberView[];
  busy: boolean;
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  existingChat?: ExistingChatPrompt | null;
  onOpenExisting?: (threadId: string) => void;
}) {
  const onChatIds = new Set(
    people.filter((row) => row.role !== 'owner').map((row) => row.userId),
  );
  const staff = team.filter((row) => row.role !== 'owner');
  const owners = people.filter((row) => row.role === 'owner');
  const existingLabel = existingChat?.title?.trim() || 'that chat';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Team on chat"
      footer={
        existingChat && onOpenExisting ? (
          <div className="flex flex-col gap-2.5">
            <p className="rounded-xl bg-foam px-3 py-2.5 text-sm font-medium text-ink">
              Same as {existingLabel}.
            </p>
            <Button fullWidth onClick={() => onOpenExisting(existingChat.threadId)}>
              Open chat
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-2 pb-8">
        {staff.map((row) => {
          const on = onChatIds.has(row.userId);
          return (
            <TeamPersonRow
              key={row.userId}
              name={row.name}
              selected={on}
              trailing={on ? 'Selected' : 'Add'}
              disabled={busy}
              onClick={() => (on ? onRemove(row.userId) : onAdd(row.userId))}
            />
          );
        })}
        {owners.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
            {owners.map((person) => (
              <TeamPersonRow key={person.userId} name={person.name} trailing="Owner" />
            ))}
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
