type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeChatsNewChat(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestChatsNewChat(): void {
  for (const listener of listeners) listener();
}
