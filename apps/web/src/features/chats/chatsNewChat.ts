type Listener = () => void;

const EVENT = 'ekum:chats-new';

/**
 * AppShell header and ChatsPage can load in separate chunks. A module-level
 * Set would not be shared across those bundles — use window so ＋ always opens
 * the New chat sheet on /chats.
 */
export function subscribeChatsNewChat(listener: Listener): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function requestChatsNewChat(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVENT));
}
