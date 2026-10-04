const CHAT_LIST_SEGMENTS = new Set(['archived', 'starred', 'find']);

/**
 * Immersive chat surfaces — thread + group info.
 * Inbox helpers (starred / archived / find) keep the bottom nav.
 */
export function isChatThreadPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'chats' || !parts[1]) return false;
  if (CHAT_LIST_SEGMENTS.has(parts[1])) return false;
  return true;
}
