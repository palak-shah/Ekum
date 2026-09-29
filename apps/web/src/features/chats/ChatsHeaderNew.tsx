import { useSyncExternalStore } from 'react';
import { PlusIcon } from '@/ui/icons';
import { useTeamCaps } from '@/lib/teamCaps';
import { getChatsInboxSelecting, subscribeChatsInboxSelect } from './chatsInboxSelect';
import { requestChatsNewChat } from './chatsNewChat';

/** WhatsApp-style New chat — filled circle, far top-right of Chats. */
export function ChatsHeaderNew() {
  const { can } = useTeamCaps();
  const selecting = useSyncExternalStore(subscribeChatsInboxSelect, getChatsInboxSelecting);
  if (!can('chats') || selecting) return null;

  return (
    <button
      type="button"
      data-testid="chats-new"
      aria-label="New chat"
      onClick={() => requestChatsNewChat()}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-[0_2px_8px_rgba(15,76,71,0.35)] hover:bg-accent-dark"
    >
      <PlusIcon width={22} height={22} />
    </button>
  );
}
