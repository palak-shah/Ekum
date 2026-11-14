/** Inbox actions that keep the open thread (presence unchanged / emptied in place). */
export type ThreadInboxStayAction = 'archive' | 'clear' | 'delete' | 'unread';

/**
 * Archive and delete leave the conversation. Clear and mark-unread stay —
 * unread is only a read-state change, not a hide/remove.
 */
export function staysOnThreadAfterInboxAction(action: ThreadInboxStayAction): boolean {
  return action === 'clear' || action === 'unread';
}
