import { useEffect, useState } from 'react';
import type { MuteFor } from '@ekum/domain-types';
import { MUTE_FOR_OPTIONS } from '@/features/chats/ChatMuteDurationFlyout';
import { MoreActionsSheet, type MoreActionItem } from '@/ui/MoreActionsSheet';
import { BellIcon, LockIcon, PaperPlaneIcon, TrashIcon } from '@/ui/icons';
import type { ShopOverflowItem } from './shopOverflowMenu';

export function CompanyOverflowMenu({
  open,
  items,
  muted,
  mutePending,
  onClose,
  onShare,
  onMute,
  onPickMute,
  onBlock,
  onRemove,
  title = 'Shop',
}: {
  open: boolean;
  items: ShopOverflowItem[];
  muted: boolean;
  mutePending?: boolean;
  onClose: () => void;
  onShare: () => void;
  onMute: () => void;
  onPickMute: (muteFor: MuteFor) => void;
  onBlock: () => void;
  onRemove: () => void;
  title?: string;
}) {
  const [step, setStep] = useState<'root' | 'mute'>('root');

  useEffect(() => {
    if (!open) setStep('root');
  }, [open]);

  const rootItems: MoreActionItem[] = items.map((item) => {
    if (item === 'share') {
      return {
        id: 'share',
        label: 'Share',
        icon: <PaperPlaneIcon width={20} height={20} />,
        testId: 'company-overflow-share',
        onClick: () => {
          onClose();
          onShare();
        },
      };
    }
    if (item === 'mute') {
      return {
        id: 'mute',
        label: muted ? 'Unmute' : 'Mute',
        icon: <BellIcon width={20} height={20} />,
        testId: 'company-overflow-mute',
        disabled: mutePending,
        active: !muted && step === 'mute',
        onClick: () => {
          if (muted) {
            onMute();
            return;
          }
          setStep('mute');
        },
      };
    }
    if (item === 'block') {
      return {
        id: 'block',
        label: 'Block',
        icon: <LockIcon width={20} height={20} />,
        testId: 'company-overflow-block',
        danger: true,
        onClick: () => {
          onClose();
          onBlock();
        },
      };
    }
    return {
      id: 'remove',
      label: 'Remove connection',
      icon: <TrashIcon width={20} height={20} />,
      testId: 'company-overflow-remove',
      danger: true,
      onClick: () => {
        onClose();
        onRemove();
      },
    };
  });

  const muteItems: MoreActionItem[] = MUTE_FOR_OPTIONS.map((row) => ({
    id: row.id,
    label: row.label,
    icon: <BellIcon width={20} height={20} />,
    testId: `chat-mute-${row.id}`,
    disabled: mutePending,
    onClick: () => {
      setStep('root');
      onPickMute(row.id);
    },
  }));

  return (
    <MoreActionsSheet
      open={open}
      onClose={onClose}
      title={step === 'mute' ? 'Mute for' : title}
      testId="company-overflow-menu"
      onBack={step === 'mute' ? () => setStep('root') : undefined}
      backTestId="company-overflow-mute-back"
      items={step === 'mute' ? muteItems : rootItems}
    />
  );
}
