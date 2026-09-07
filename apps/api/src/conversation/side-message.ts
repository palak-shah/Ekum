/** Your-side leave lines stay on our shop only. Denied pack Asks stay owner-only. */
export function messageVisibleToCompany(
  message: { type: string; metadata: unknown },
  companyId: string,
): boolean {
  const meta = message.metadata;
  if (!meta || typeof meta !== 'object') {
    if (message.type !== 'system') return true;
    return true;
  }
  const record = meta as {
    side?: string;
    companyId?: string;
    kind?: string;
    status?: string;
    requesterCompanyId?: string;
    targetCompanyId?: string;
  };
  if (record.kind === 'collection_view_request' && record.status === 'denied') {
    return record.targetCompanyId === companyId;
  }
  if (message.type !== 'system') return true;
  if (record.side === 'company') {
    return record.companyId === companyId;
  }
  return true;
}
