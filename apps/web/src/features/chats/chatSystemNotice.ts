/**
 * Plain leave / roster system lines (not order cards or pack asks).
 * Rendered as a centered WhatsApp-style notice, not a chat bubble.
 */
export function isChatSystemNotice(message: {
  type: string;
  metadata?: unknown;
  referenceId?: string | null;
}): boolean {
  if (message.type !== 'system') return false;
  if (message.referenceId) return false;
  const meta =
    message.metadata && typeof message.metadata === 'object'
      ? (message.metadata as Record<string, unknown>)
      : null;
  if (!meta) return true;
  if (meta.kind === 'member_left' || meta.kind === 'company_left') return true;
  if (meta.kind === 'collection_view_request' || meta.kind === 'relist_request') return false;
  if (meta.kind === 'order_lines' || meta.kind === 'order') return false;
  if (meta.side === 'company') return false;
  return !meta.kind;
}
