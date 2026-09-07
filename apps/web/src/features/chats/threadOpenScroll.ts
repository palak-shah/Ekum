/**
 * WhatsApp-style thread open: first unread among other-party messages
 * after lastReadAt (matches API unreadCount).
 */
export function firstUnreadMessageId(
  messages: { id: string; createdAt: string; senderCompanyId: string }[],
  opts: { lastReadAt: string | null; viewerCompanyId: string },
): string | null {
  const { viewerCompanyId, lastReadAt } = opts;
  const cutoff = lastReadAt ? Date.parse(lastReadAt) : Number.NEGATIVE_INFINITY;
  for (const message of messages) {
    if (message.senderCompanyId === viewerCompanyId) continue;
    const at = Date.parse(message.createdAt);
    if (Number.isNaN(at)) continue;
    if (at > cutoff) return message.id;
  }
  return null;
}

export function unreadDividerLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return n === 1 ? '1 unread message' : `${n} unread messages`;
}
