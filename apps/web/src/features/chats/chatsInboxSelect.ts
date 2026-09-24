type Listener = () => void;

const listeners = new Set<Listener>();
let selecting = false;

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeChatsInboxSelect(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getChatsInboxSelecting(): boolean {
  return selecting;
}

export function setChatsInboxSelecting(next: boolean): void {
  if (selecting === next) return;
  selecting = next;
  emit();
}

export function requestChatsInboxSelect(): void {
  setChatsInboxSelecting(true);
}
