import { useEffect, useState } from 'react';
import type { MuteFor } from '@ekum/domain-types';
import { MUTE_FOR_OPTIONS } from './ChatMuteDurationFlyout';
import { MoreActionsSheet, type MoreActionItem } from '@/ui/MoreActionsSheet';
import {
  BellIcon,
  CollectionIcon,
  LockIcon,
  PinIcon,
  TrashIcon,
} from '@/ui/icons';

export function ChatsInboxRowMenu({
  isGroup,
  pinned,
  muted,
  unread,
  archived,
  pending,
  open,
  title = 'Chat',
  anchor = null,
  onClose,
  onPin,
  onMute,
  onPickMute,
  onUnread,
  onArchive,
  onClear,
  onDelete,
  onExitGroup,
  onBlock,
}: {
  isGroup: boolean;
  pinned: boolean;
  muted: boolean;
  unread?: boolean;
  archived?: boolean;
  pending?: boolean;
  /** When false, sheet is closed. Prefer over legacy `anchor`. */
  open?: boolean;
  title?: string;
  /** @deprecated positioning unused — sheet is bottom-anchored. Kept for call-site compat. */
  anchor?: { top: number; bottom: number; right: number } | null;
  onClose: () => void;
  onPin: () => void;
  onMute: () => void;
  onPickMute?: (muteFor: MuteFor) => void;
  onUnread?: () => void;
  onArchive: () => void;
  onClear: () => void;
  onDelete: () => void;
  onExitGroup: () => void;
  onBlock?: () => void;
}) {
  const [step, setStep] = useState<'root' | 'mute'>('root');
  const sheetOpen = open ?? Boolean(anchor);

  useEffect(() => {
    if (!sheetOpen) setStep('root');
  }, [sheetOpen]);

  const rootItems: MoreActionItem[] = [
    {
      id: 'pin',
      label: pinned ? 'Unpin chat' : 'Pin chat',
      icon: <PinIcon width={20} height={20} />,
      testId: 'chats-row-pin',
      disabled: pending,
      onClick: onPin,
    },
    {
      id: 'mute',
      label: muted ? 'Unmute' : 'Mute',
      icon: <BellIcon width={20} height={20} />,
      testId: 'chats-row-mute',
      disabled: pending,
      active: !muted && step === 'mute',
      onClick: () => {
        if (muted) {
          onMute();
          return;
        }
        if (onPickMute) setStep('mute');
        else onMute();
      },
    },
  ];
  if (!unread && onUnread) {
    rootItems.push({
      id: 'unread',
      label: 'Mark as unread',
      icon: <BellIcon width={20} height={20} />,
      testId: 'chats-row-unread',
      disabled: pending,
      onClick: onUnread,
    });
  }
  rootItems.push(
    {
      id: 'archive',
      label: archived ? 'Unarchive' : 'Archive',
      icon: <CollectionIcon width={20} height={20} />,
      testId: archived ? 'chats-row-unarchive' : 'chats-row-archive',
      disabled: pending,
      onClick: onArchive,
    },
    {
      id: 'clear',
      label: 'Clear chat',
      icon: <TrashIcon width={20} height={20} />,
      testId: 'chats-row-clear',
      disabled: pending,
      onClick: onClear,
    },
  );
  if (isGroup) {
    rootItems.push({
      id: 'exit',
      label: 'Exit group',
      icon: <TrashIcon width={20} height={20} />,
      testId: 'chats-row-exit',
      disabled: pending,
      danger: true,
      onClick: onExitGroup,
    });
  } else {
    rootItems.push({
      id: 'delete',
      label: 'Delete chat',
      icon: <TrashIcon width={20} height={20} />,
      testId: 'chats-row-delete',
      disabled: pending,
      danger: true,
      onClick: onDelete,
    });
    if (onBlock) {
      rootItems.push({
        id: 'block',
        label: 'Block',
        icon: <LockIcon width={20} height={20} />,
        testId: 'chats-row-block',
        disabled: pending,
        danger: true,
        onClick: onBlock,
      });
    }
  }

  const muteItems: MoreActionItem[] = MUTE_FOR_OPTIONS.map((row) => ({
    id: row.id,
    label: row.label,
    icon: <BellIcon width={20} height={20} />,
    testId: `chat-mute-${row.id}`,
    disabled: pending,
    onClick: () => {
      setStep('root');
      onPickMute?.(row.id);
    },
  }));

  return (
    <MoreActionsSheet
      open={sheetOpen}
      onClose={onClose}
      title={step === 'mute' ? 'Mute for' : title}
      testId="chats-row-menu"
      onBack={step === 'mute' ? () => setStep('root') : undefined}
      items={step === 'mute' ? muteItems : rootItems}
    />
  );
}
