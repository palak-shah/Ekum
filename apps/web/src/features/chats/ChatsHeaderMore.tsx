import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReferralView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useChatUnreadCount, useMyCompany } from '@/lib/queries';
import { shareOpenConnectInvite } from '@/features/referrals/shareOpenConnectInvite';
import { useToast } from '@/ui/Toast';
import { cx } from '@/ui/kit';
import { MoreHorizontalIcon } from '@/ui/icons';
import {
  getChatsInboxSelecting,
  requestChatsInboxSelect,
  setChatsInboxSelecting,
  subscribeChatsInboxSelect,
} from './chatsInboxSelect';

const ITEM =
  'flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40';

/** Inbox ⋯ — floating menu like WhatsApp / thread ⋯, not a sheet. */
export function ChatsHeaderMore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const { showToast } = useToast();
  const chatUnread = useChatUnreadCount();
  const [inviteSharing, setInviteSharing] = useState(false);
  const hasUnread = (chatUnread.data?.count ?? 0) > 0;
  const selecting = useSyncExternalStore(subscribeChatsInboxSelect, getChatsInboxSelecting);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState({ top: 0, right: 8 });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const readAll = useMutation({
    mutationFn: () => api.post<{ ok: true }>('/threads/read-all', {}),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not mark chats read.'),
  });

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  if (selecting) {
    return (
      <button
        type="button"
        data-testid="chats-select-cancel"
        className="rounded-full px-2 py-1.5 text-sm font-semibold text-accent hover:bg-foam"
        onClick={() => setChatsInboxSelecting(false)}
      >
        Cancel
      </button>
    );
  }

  return (
    <>
      <button
        ref={anchorRef}
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
      {open && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-[60] cursor-default bg-ink/15"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                role="menu"
                data-testid="chats-more-menu"
                className="fixed z-[61] min-w-[11rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
                style={{ top: pos.top, right: pos.right }}
              >
                {error ? (
                  <p className="border-b border-line/70 px-3.5 py-2 text-sm text-danger">{error}</p>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  data-testid="chats-select"
                  className={ITEM}
                  onClick={() => {
                    setOpen(false);
                    requestChatsInboxSelect();
                  }}
                >
                  Select chats
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="chats-starred"
                  className={cx(ITEM, 'border-t border-line/70')}
                  onClick={() => {
                    setOpen(false);
                    navigate('/chats/starred');
                  }}
                >
                  Starred
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="chats-archived"
                  className={cx(ITEM, 'border-t border-line/70')}
                  onClick={() => {
                    setOpen(false);
                    navigate('/chats/archived');
                  }}
                >
                  Archived
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="chats-mark-all-read"
                  disabled={readAll.isPending || !hasUnread}
                  className={cx(ITEM, 'border-t border-line/70')}
                  onClick={() => {
                    if (!hasUnread) return;
                    readAll.mutate();
                    setOpen(false);
                  }}
                >
                  {readAll.isPending ? 'Reading…' : 'Mark all read'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="chats-invite-connect"
                  disabled={inviteSharing}
                  className={cx(ITEM, 'border-t border-line/70')}
                  onClick={() => {
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
                  }}
                >
                  {inviteSharing ? 'Sharing…' : 'Invite to connect'}
                </button>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
