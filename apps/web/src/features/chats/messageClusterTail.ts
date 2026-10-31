import { isChatSystemNotice } from './chatSystemNotice';

/** Cluster identity: outgoing is one run; incoming splits by sender shop. */
export function messageClusterKey(message: {
  mine: boolean;
  senderCompanyId: string;
  type: string;
  metadata?: unknown;
  referenceId?: string | null;
}): string | null {
  if (isChatSystemNotice(message)) return null;
  return message.mine ? 'mine' : `in:${message.senderCompanyId}`;
}

/**
 * WhatsApp last-of-run: tail on the last consecutive bubble from that side.
 * Centered system notices are skipped and do not break a run.
 */
export function messageHasClusterTail(
  messages: Array<{
    mine: boolean;
    senderCompanyId: string;
    type: string;
    metadata?: unknown;
    referenceId?: string | null;
  }>,
  index: number,
): boolean {
  const key = messageClusterKey(messages[index]!);
  if (!key) return false;
  for (let i = index + 1; i < messages.length; i += 1) {
    const next = messageClusterKey(messages[i]!);
    if (next === null) continue;
    return next !== key;
  }
  return true;
}
