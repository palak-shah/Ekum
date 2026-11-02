/** Quoted shop on a user reply — You when the parent is our shop. */
export function replyQuoteFromLabel(input: {
  senderCompanyId?: string | null;
  viewerCompanyId?: string | null;
  shopName?: string | null;
}): string {
  if (!input.senderCompanyId) return 'Message';
  if (input.viewerCompanyId && input.senderCompanyId === input.viewerCompanyId) return 'You';
  return input.shopName?.trim() || 'Message';
}
