import { PlusIcon } from '@/ui/icons';
import { useTeamCaps } from '@/lib/teamCaps';
import { requestChatsNewChat } from './chatsNewChat';

/** WhatsApp-style New chat — filled circle, far top-right of Chats. */
export function ChatsHeaderNew() {
  const { can } = useTeamCaps();
  if (!can('chats')) return null;

  return (
    <button
      type="button"
      data-testid="chats-new"
      aria-label="New chat"
      onClick={() => requestChatsNewChat()}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_2px_8px_rgb(31_42_48_/_0.35)] hover:bg-accent-dark"
    >
      <PlusIcon width={22} height={22} />
    </button>
  );
}
