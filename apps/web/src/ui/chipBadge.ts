/** Chip count (Chats Unread, Orders Need you). Hidden at 0. */
export function chipCountBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}
