import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type CursorPage, type MuteFor, type ThreadSummary } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, EmptyState, ErrorState, LoadingBlock, Sheet } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import { InboxThreadRow } from './InboxThreadRow';
import { ChatsInboxRowMenu } from './ChatsInboxRowMenu';

export function ArchivedChatsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [menuThread, setMenuThread] = useState<ThreadSummary | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    bottom: number;
    right: number;
  } | null>(null);
  const [confirm, setConfirm] = useState<'clear' | 'delete' | 'exit' | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const hidden = useQuery({
    queryKey: ['threads', { inbox: 'hidden' }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', {
        limit: 40,
        state: 'active',
        inbox: 'hidden',
      }),
  });

  const inboxAct = useMutation({
    mutationFn: (payload: { action: 'unarchive' | 'unread' | 'clear' | 'delete'; threadIds: string[] }) =>
      api.post<{ ok: true; count: number }>('/threads/inbox-actions', payload),
    onSuccess: (_data, vars) => {
      setMenuThread(null);
      setConfirm(null);
      setConfirmId(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
      showToast(
        vars.action === 'unarchive'
          ? 'Back in All Chats'
          : vars.action === 'unread'
            ? 'Marked unread'
            : vars.action === 'clear'
              ? 'Chat cleared'
              : 'Chat deleted',
      );
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not update chat.', 'danger');
    },
  });

  const pinRow = useMutation({
    mutationFn: (payload: { id: string; pinned: boolean }) =>
      api.patch(`/threads/${payload.id}/pin`, { pinned: payload.pinned }),
    onSuccess: () => {
      setMenuThread(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not update pin.', 'danger');
    },
  });

  const muteRow = useMutation({
    mutationFn: (payload: { id: string; alertLevel: 'all' | 'muted'; muteFor?: MuteFor }) =>
      api.patch(`/threads/${payload.id}/alert`, {
        alertLevel: payload.alertLevel,
        ...(payload.muteFor ? { muteFor: payload.muteFor } : {}),
      }),
    onSuccess: () => {
      setMenuThread(null);
      setMenuAnchor(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not mute.', 'danger');
    },
  });

  const exitGroup = useMutation({
    mutationFn: (threadId: string) => api.post(`/threads/${threadId}/leave`, {}),
    onSuccess: () => {
      setConfirm(null);
      setConfirmId(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      showToast('Left the group');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not exit this group.', 'danger');
    },
  });

  if (hidden.isLoading && !hidden.data) {
    return <LoadingBlock label="Loading archived…" />;
  }
  if (hidden.isError) {
    return (
      <>
        <PageHeader title="Archived" onBack={() => navigate('/chats')} />
        <ErrorState message="Could not load archived chats." />
      </>
    );
  }

  const rows = hidden.data?.results ?? [];
  const pending =
    inboxAct.isPending || pinRow.isPending || muteRow.isPending || exitGroup.isPending;

  return (
    <div className="flex flex-col gap-3 pb-4">
      <PageHeader title="Archived" onBack={() => navigate('/chats')} />
      {rows.length === 0 ? (
        <EmptyState title="Nothing archived" message="Archive a chat from All Chats to find it here." />
      ) : (
        <div className="-mx-4 overflow-hidden bg-surface">
          {rows.map((thread) => (
            <InboxThreadRow
              key={thread.id}
              thread={thread}
              selecting={false}
              selected={menuThread?.id === thread.id}
              canMenu
              onMenu={(rect) => {
                setMenuThread(thread);
                setMenuAnchor(rect);
              }}
              onToggle={() => undefined}
            />
          ))}
        </div>
      )}

      {menuThread ? (
        <ChatsInboxRowMenu
          isGroup={menuThread.type === 'group'}
          pinned={menuThread.pinned}
          muted={menuThread.alertLevel === 'muted'}
          unread={menuThread.unreadCount > 0}
          archived
          pending={pending}
          anchor={menuAnchor}
          onClose={() => {
            setMenuThread(null);
            setMenuAnchor(null);
          }}
          onPin={() => pinRow.mutate({ id: menuThread.id, pinned: !menuThread.pinned })}
          onUnread={() => {
            const id = menuThread.id;
            setMenuThread(null);
            inboxAct.mutate({ action: 'unread', threadIds: [id] });
          }}
          onMute={() => {
            muteRow.mutate({ id: menuThread.id, alertLevel: 'all' });
          }}
          onPickMute={(muteFor) => {
            muteRow.mutate({ id: menuThread.id, alertLevel: 'muted', muteFor });
          }}
          onArchive={() => {
            const id = menuThread.id;
            setMenuThread(null);
            inboxAct.mutate({ action: 'unarchive', threadIds: [id] });
          }}
          onClear={() => {
            setConfirmId(menuThread.id);
            setMenuThread(null);
            setConfirm('clear');
          }}
          onDelete={() => {
            setConfirmId(menuThread.id);
            setMenuThread(null);
            setConfirm('delete');
          }}
          onExitGroup={() => {
            setConfirmId(menuThread.id);
            setMenuThread(null);
            setConfirm('exit');
          }}
        />
      ) : null}

      <Sheet
        open={confirm != null}
        onClose={() => {
          setConfirm(null);
          setConfirmId(null);
        }}
        title={
          confirm === 'exit' ? 'Exit this group?' : confirm === 'delete' ? 'Delete chat?' : 'Clear chat?'
        }
      >
        <p className="text-sm text-muted">
          {confirm === 'exit'
            ? 'Off your inbox. Other shops stay in the group.'
            : confirm === 'clear'
              ? 'Your shop only. They keep the chat and the messages.'
              : 'Your shop only. They keep the chat.'}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant={confirm === 'clear' ? 'primary' : 'danger'}
            disabled={pending}
            onClick={() => {
              if (!confirmId) return;
              if (confirm === 'exit') {
                exitGroup.mutate(confirmId);
                return;
              }
              if (confirm) inboxAct.mutate({ action: confirm, threadIds: [confirmId] });
            }}
          >
            {confirm === 'exit' ? 'Exit group' : confirm === 'delete' ? 'Delete' : 'Clear'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirm(null);
              setConfirmId(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
