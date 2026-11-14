/**
 * Locked label order for thread ⋯ (parity with inbox long-press hygiene + Ekum team/group rows).
 * Block is absolute last on 1:1. Groups use Exit group (not Leave).
 */
export type ThreadMoreMenuInput = {
  pinned: boolean;
  muted: boolean;
  type: string;
  canManagePeople: boolean;
  unreadCount: number;
  canLeave: boolean;
  canRemoveGroup: boolean;
  hasCounterpart: boolean;
};

export type ThreadMoreMenuLabel =
  | 'Pin chat'
  | 'Unpin chat'
  | 'Mute'
  | 'Unmute'
  | 'Group photo'
  | 'Team on chat'
  | 'Mark as unread'
  | 'Archive'
  | 'Clear chat'
  | 'Leave'
  | 'Delete chat'
  | 'Block'
  | 'Exit group'
  | 'Remove group';

export type ThreadMoreMenuId =
  | 'pin'
  | 'mute'
  | 'group-photo'
  | 'people'
  | 'unread'
  | 'archive'
  | 'clear'
  | 'leave'
  | 'delete'
  | 'block'
  | 'exit'
  | 'remove-group';

export type ThreadMoreMenuRow = {
  id: ThreadMoreMenuId;
  label: ThreadMoreMenuLabel;
  danger?: boolean;
};

export function threadMoreMenuOrder(input: ThreadMoreMenuInput): ThreadMoreMenuRow[] {
  const rows: ThreadMoreMenuRow[] = [
    {
      id: 'pin',
      label: input.pinned ? 'Unpin chat' : 'Pin chat',
    },
    {
      id: 'mute',
      label: input.muted ? 'Unmute' : 'Mute',
    },
  ];

  if (input.type === 'group' && input.canManagePeople) {
    rows.push({ id: 'group-photo', label: 'Group photo' });
  }
  if (input.canManagePeople) {
    rows.push({ id: 'people', label: 'Team on chat' });
  }
  if (input.unreadCount <= 0) {
    rows.push({ id: 'unread', label: 'Mark as unread' });
  }
  rows.push({ id: 'archive', label: 'Archive' }, { id: 'clear', label: 'Clear chat' });

  if (input.type === 'group') {
    if (input.canLeave) {
      rows.push({ id: 'exit', label: 'Exit group', danger: true });
    }
    if (input.canRemoveGroup) {
      rows.push({ id: 'remove-group', label: 'Remove group', danger: true });
    }
    return rows;
  }

  if (input.canLeave) {
    rows.push({ id: 'leave', label: 'Leave' });
  }
  rows.push({ id: 'delete', label: 'Delete chat', danger: true });
  if (input.hasCounterpart) {
    rows.push({ id: 'block', label: 'Block', danger: true });
  }
  return rows;
}

export function threadMoreMenuLabels(input: ThreadMoreMenuInput): ThreadMoreMenuLabel[] {
  return threadMoreMenuOrder(input).map((row) => row.label);
}
