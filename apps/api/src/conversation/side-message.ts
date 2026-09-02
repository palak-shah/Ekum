/** Your-side leave lines stay on our shop only. */
export function messageVisibleToCompany(
  message: { type: string; metadata: unknown },
  companyId: string,
): boolean {
  if (message.type !== 'system') return true;
  const meta = message.metadata;
  if (!meta || typeof meta !== 'object') return true;
  const record = meta as { side?: string; companyId?: string };
  if (record.side === 'company') {
    return record.companyId === companyId;
  }
  return true;
}
