const CHAT_LIST_SEGMENTS = new Set(['archived', 'starred', 'find']);

/**
 * Immersive chat surfaces — thread + group info (full-height column).
 * Inbox helpers (starred / archived / find) are list pages, not threads.
 * Bottom nav is the shell allowlist: only `/chats` keeps it.
 */
export function isChatThreadPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'chats' || !parts[1]) return false;
  if (CHAT_LIST_SEGMENTS.has(parts[1])) return false;
  return true;
}
