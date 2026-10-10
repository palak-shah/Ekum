import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReferralView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useChatUnreadCount, useMyCompany } from '@/lib/queries';
import { shareOpenConnectInvite } from '@/features/referrals/shareOpenConnectInvite';
import { useToast } from '@/ui/Toast';
import { cx } from '@/ui/kit';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import {
  BellIcon,
  BookmarkIcon,
  CheckIcon,
  CollectionIcon,
  MegaphoneIcon,
  MoreHorizontalIcon,
} from '@/ui/icons';

/** Inbox ⋯ — bottom sheet (app-wide more chrome). */
export function ChatsHeaderMore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const { showToast } = useToast();
  const chatUnread = useChatUnreadCount();
  const [inviteSharing, setInviteSharing] = useState(false);
  const hasUnread = (chatUnread.data?.count ?? 0) > 0;
  const [open, setOpen] = useState(false);

  const readAll = useMutation({
    mutationFn: () => api.post<{ ok: true }>('/threads/read-all', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not mark chats read.', 'danger'),
  });

  return (
    <>
      <button
        type="button"
        data-testid="chats-more"
        aria-label="More"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((next) => !next)}
        className={cx(
          'rounded-full p-2 transition-colors',
          open ? 'bg-foam text-ink' : 'text-slate hover:bg-foam hover:text-ink',
        )}
      >
        <MoreHorizontalIcon width={22} height={22} />
      </button>
      <MoreActionsSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Chats"
        testId="chats-more-menu"
        items={[
          {
            id: 'starred',
            label: 'Starred',
            icon: <BookmarkIcon width={20} height={20} />,
            testId: 'chats-starred',
            onClick: () => {
              setOpen(false);
              navigate('/chats/starred');
            },
          },
          {
            id: 'archived',
            label: 'Archived',
            icon: <CollectionIcon width={20} height={20} />,
            testId: 'chats-archived',
            onClick: () => {
              setOpen(false);
              navigate('/chats/archived');
            },
          },
          {
            id: 'read',
            label: readAll.isPending ? 'Reading…' : 'Mark all read',
            icon: <CheckIcon width={20} height={20} />,
            testId: 'chats-mark-all-read',
            disabled: readAll.isPending || !hasUnread,
            onClick: () => {
              if (!hasUnread) return;
              readAll.mutate();
              setOpen(false);
            },
          },
          {
            id: 'invite',
            label: inviteSharing ? 'Sharing…' : 'Invite to connect',
            icon: <MegaphoneIcon width={20} height={20} />,
            testId: 'chats-invite-connect',
            disabled: inviteSharing,
            onClick: () => {
              setOpen(false);
              void (async () => {
                if (inviteSharing) return;
                setInviteSharing(true);
                try {
                  const result = await shareOpenConnectInvite({
                    postReferral: () => api.post<ReferralView>('/referrals', {}),
                    origin: window.location.origin,
                    companyName: company.data?.name ?? '',
                  });
                  if (result === 'copied') showToast('Link copied');
                } catch (err) {
                  if (err instanceof DOMException && err.name === 'AbortError') return;
                  showToast(
                    err instanceof ApiError ? err.message : 'Could not share the invite.',
                    'danger',
                  );
                } finally {
                  setInviteSharing(false);
                }
              })();
            },
          },
        ]}
      />
    </>
  );
}
