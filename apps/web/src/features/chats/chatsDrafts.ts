const KEY = 'ekum.chatDrafts.v1';

type DraftMap = Record<string, string>;

let memory: DraftMap | null = null;
const listeners = new Set<() => void>();

function read(): DraftMap {
  if (memory) return memory;
  if (typeof localStorage === 'undefined') {
    memory = {};
    return memory;
  }
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as DraftMap) : {};
  } catch {
    memory = {};
  }
  return memory;
}

function write(next: DraftMap) {
  memory = next;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
  }
  listeners.forEach((fn) => fn());
}

export function getChatDraft(threadId: string): string {
  return read()[threadId] ?? '';
}

export function setChatDraft(threadId: string, body: string) {
  const next = { ...read() };
  const trimmed = body;
  if (!trimmed.trim()) {
    if (!(threadId in next)) return;
    delete next[threadId];
  } else {
    next[threadId] = trimmed;
  }
  write(next);
}

export function subscribeChatDrafts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper. */
export function resetChatDrafts() {
  memory = {};
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
  listeners.forEach((fn) => fn());
}
