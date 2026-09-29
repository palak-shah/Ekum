export type ChatsInboxChip = 'all' | 'unread' | 'groups' | 'requests';

export const CHATS_REQUESTS_HREF = '/chats?inbox=requests';

type InboxListener = () => void;

const inboxListeners = new Set<InboxListener>();
let rememberedInbox: ChatsInboxChip = 'all';

function emitRememberedInbox() {
  for (const listener of inboxListeners) listener();
}

/** Last All / Unread / Groups / Requests chip — Back from a thread keeps it. */
export function rememberChatsInbox(chip: ChatsInboxChip) {
  if (rememberedInbox === chip) return;
  rememberedInbox = chip;
  emitRememberedInbox();
}

export function getRememberedChatsInbox(): ChatsInboxChip {
  return rememberedInbox;
}

export function subscribeRememberedChatsInbox(listener: InboxListener): () => void {
  inboxListeners.add(listener);
  return () => inboxListeners.delete(listener);
}

export function chatsInboxHref(chip: ChatsInboxChip = rememberedInbox): string {
  return chip === 'all' ? '/chats' : `/chats?inbox=${chip}`;
}

/** Deep link `?inbox=` for Unread / Groups / Requests. Missing or unknown → All. */
export function chatsInboxFromSearch(search: string): ChatsInboxChip {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const value = new URLSearchParams(raw).get('inbox');
  if (value === 'unread' || value === 'groups' || value === 'requests') return value;
  return 'all';
}

export function filterActiveInbox<T extends { unreadCount: number; type: string }>(
  threads: T[],
  chip: ChatsInboxChip,
): T[] {
  if (chip === 'unread') return threads.filter((row) => row.unreadCount > 0);
  if (chip === 'groups') return threads.filter((row) => row.type === 'group');
  return threads;
}

export function chatsInboxEmptyCopy(chip: ChatsInboxChip, searching: boolean) {
  if (searching) {
    return { title: 'No matches', message: 'Try another name, order, or message.' };
  }
  if (chip === 'unread') {
    return { title: 'Nothing unread', message: 'Caught up.' };
  }
  if (chip === 'groups') {
    return { title: 'No groups', message: 'Start a group from ＋.' };
  }
  if (chip === 'requests') {
    return {
      title: 'No requests',
      message: 'First messages, connect invites, and See new packs asks land here.',
    };
  }
  return { title: 'No chats yet', message: 'Find a business to start chatting.' };
}

/** WhatsApp-style chip badge: unread chats, unread groups, or request rows. All has none. */
export function chatsInboxChipCount(
  chip: ChatsInboxChip,
  input: {
    active: Array<{ unreadCount: number; type: string }>;
    pendingCount: number;
    askCount: number;
  },
): number {
  if (chip === 'unread') return input.active.filter((row) => row.unreadCount > 0).length;
  if (chip === 'groups') {
    return input.active.filter((row) => row.type === 'group' && row.unreadCount > 0).length;
  }
  if (chip === 'requests') return input.pendingCount + input.askCount;
  return 0;
}

export function chatsInboxChipBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}
