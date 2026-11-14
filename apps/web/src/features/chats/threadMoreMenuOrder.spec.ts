import { describe, expect, it } from 'vitest';
import { threadMoreMenuLabels } from './threadMoreMenuOrder';

describe('threadMoreMenuOrder', () => {
  it('locks 1:1 read owner order with Block last', () => {
    expect(
      threadMoreMenuLabels({
        pinned: false,
        muted: false,
        type: 'direct',
        canManagePeople: true,
        unreadCount: 0,
        canLeave: true,
        canRemoveGroup: false,
        hasCounterpart: true,
      }),
    ).toEqual([
      'Pin chat',
      'Mute',
      'Team on chat',
      'Mark as unread',
      'Archive',
      'Clear chat',
      'Leave',
      'Delete chat',
      'Block',
    ]);
  });

  it('omits Team and Mark as unread for staff on an unread 1:1', () => {
    expect(
      threadMoreMenuLabels({
        pinned: false,
        muted: false,
        type: 'direct',
        canManagePeople: false,
        unreadCount: 2,
        canLeave: false,
        canRemoveGroup: false,
        hasCounterpart: true,
      }),
    ).toEqual(['Pin chat', 'Mute', 'Archive', 'Clear chat', 'Delete chat', 'Block']);
  });

  it('locks group owner order with Exit group (not Leave)', () => {
    expect(
      threadMoreMenuLabels({
        pinned: true,
        muted: true,
        type: 'group',
        canManagePeople: true,
        unreadCount: 0,
        canLeave: true,
        canRemoveGroup: true,
        hasCounterpart: false,
      }),
    ).toEqual([
      'Unpin chat',
      'Unmute',
      'Group photo',
      'Team on chat',
      'Mark as unread',
      'Archive',
      'Clear chat',
      'Exit group',
      'Remove group',
    ]);
  });
});
