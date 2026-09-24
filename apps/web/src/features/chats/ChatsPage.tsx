import { useDeferredValue, useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type CursorPage, type MuteFor, type ThreadSummary } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useTeamCaps } from '@/lib/teamCaps';
import { FindInExploreLink } from '@/ui/FindInExploreLink';
import { Button, EmptyState, ErrorState, LoadingBlock, SearchInput, Sheet, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { ChevronRightIcon, PlusIcon } from '@/ui/icons';
import { chatMediaKindChrome } from './chatMediaKindChrome';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import { nextIdSet, selectAllState } from '@/features/browse/selectAllState';
import { StartChatSheet } from './StartChatSheet';
import { ChatsInboxDock } from './ChatsInboxDock';
import { ChatsInboxRowMenu } from './ChatsInboxRowMenu';
import { InboxThreadRow } from './InboxThreadRow';
import {
  getChatsInboxSelecting,
  setChatsInboxSelecting,
  subscribeChatsInboxSelect,
} from './chatsInboxSelect';
import { useToast } from '@/ui/Toast';

type Tab = 'active' | 'requests';
type InboxAction = 'archive' | 'clear' | 'delete' | 'unread';

const TAB_LABEL: Record<Tab, string> = {
  active: 'All Chats',
  requests: 'Requests Received',
};

function useInboxThreads(tab: Tab, q: string | undefined, live: boolean) {
  return useQuery({
    queryKey: ['threads', { tab, q }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', {
        limit: 40,
        state: tab === 'requests' ? 'pending' : 'active',
        ...(q ? { q } : {}),
      }),
    refetchInterval: live ? 12_000 : false,
    staleTime: 8_000,
    placeholderData: (previous) => previous,
  });
}

const IN_CHATS: { kind: string; label: string }[] = [
  { kind: 'photos', label: 'Photos' },
  { kind: 'documents', label: 'Documents' },
  { kind: 'collections', label: 'Collections' },
  { kind: 'designs', label: 'Designs' },
  { kind: 'links', label: 'Links' },
];

export function ChatsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { can } = useTeamCaps();
  const canChat = can('chats');
  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const [startOpen, setStartOpen] = useState(false);
  const selecting = useSyncExternalStore(subscribeChatsInboxSelect, getChatsInboxSelecting);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirm, setConfirm] = useState<'clear' | 'delete' | 'exit' | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [menuThread, setMenuThread] = useState<ThreadSummary | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    bottom: number;
    right: number;
  } | null>(null);
  useEffect(() => {
    if (selecting) {
      setTab('active');
      setSearchFocused(false);
      setQuery('');
    } else {
      setSelectedIds(new Set());
      setConfirm(null);
      setConfirmIds([]);
      setMenuThread(null);
      setMenuAnchor(null);
    }
  }, [selecting]);

  // Keep both inboxes warm so All / Requests never swap through a loader or the other list.
  const q = deferredQuery || undefined;
  const live = !deferredQuery && !selecting;
  const activeInbox = useInboxThreads('active', q, live && tab === 'active');
  const requestInbox = useInboxThreads('requests', q, live && tab === 'requests');
  const threads = tab === 'requests' ? requestInbox : activeInbox;
  const list = threads.data?.results ?? [];
  const visibleIds = list.map((row) => row.id);
  const selectState = selectAllState(visibleIds, selectedIds);
  const searching = Boolean(deferredQuery);
  const showInChats = !selecting && searchFocused && !query.trim();

  const inboxAct = useMutation({
    mutationFn: (payload: { action: InboxAction; threadIds: string[] }) =>
      api.post<{ ok: true; count: number }>('/threads/inbox-actions', payload),
    onSuccess: (_data, vars) => {
      setConfirm(null);
      setConfirmIds([]);
      setMenuThread(null);
      setMenuAnchor(null);
      setSelectedIds(new Set());
      setChatsInboxSelecting(false);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
      const n = vars.threadIds.length;
      const label =
        vars.action === 'archive'
          ? n === 1
            ? 'Chat archived'
            : `${n} chats archived`
          : vars.action === 'clear'
            ? n === 1
              ? 'Chat cleared'
              : `${n} chats cleared`
            : vars.action === 'unread'
              ? 'Marked unread'
              : n === 1
                ? 'Chat deleted'
                : `${n} chats deleted`;
      showToast(label);
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not update chats.', 'danger');
    },
  });

  const selectedList = [...selectedIds];
  const run = (action: InboxAction, threadIds?: string[]) => {
    const ids = threadIds ?? (confirmIds.length > 0 ? confirmIds : selectedList);
    if (ids.length === 0) return;
    inboxAct.mutate({ action, threadIds: ids });
  };

  const askConfirm = (kind: 'clear' | 'delete' | 'exit', ids: string[]) => {
    setConfirmIds(ids);
    setMenuThread(null);
    setMenuAnchor(null);
    setConfirm(kind);
  };

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
      setConfirmIds([]);
      setMenuThread(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
      showToast('Left the group');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not exit this group.', 'danger');
    },
  });

  const rowPending =
    inboxAct.isPending || pinRow.isPending || muteRow.isPending || exitGroup.isPending;

  return (
    <div className={cx('flex flex-col gap-4', selecting && selectedIds.size > 0 && 'pb-28')}>
      {selecting ? (
        <SelectAllFloat
          open
          count={selectedIds.size}
          allSelected={selectState.allSelected}
          onSelectAll={() => setSelectedIds(nextIdSet(visibleIds, selectedIds))}
          onClear={() => setSelectedIds(new Set())}
        />
      ) : (
        <ListSearchRow
          search={
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchFocused(false), 150);
              }}
              placeholder="Search chats"
              aria-label="Search chats"
              data-testid="chats-search"
            />
          }
          action={
            canChat ? (
              <ListSquareButton aria-label="New chat" onClick={() => setStartOpen(true)}>
                <PlusIcon width={20} height={20} />
              </ListSquareButton>
            ) : undefined
          }
        />
      )}

      {showInChats ? (
        <section data-testid="chats-in-chats" className="flex flex-col gap-2">
          <h2 className="px-0.5 text-[13px] font-semibold text-muted">In chats</h2>
          <ul className="-mx-4 overflow-hidden bg-surface">
            {IN_CHATS.map((item) => {
              const { Icon, badge } = chatMediaKindChrome(item.kind);
              return (
                <li key={item.kind}>
                  <Link
                    to={`/chats/find?kind=${item.kind}`}
                    data-testid={`chats-find-${item.kind}`}
                    className="flex items-center gap-3 border-b border-line/70 px-4 py-3.5 last:border-b-0 hover:bg-canvas active:bg-canvas"
                  >
                    <span
                      className={cx(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        badge,
                      )}
                    >
                      <Icon width={20} height={20} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{item.label}</span>
                    <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <>
          {selecting ? null : (
            <div className="flex rounded-xl bg-linen p-0.5" role="tablist" aria-label="Chat lists">
              {(['active', 'requests'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={cx(
                    'min-h-9 min-w-0 flex-1 rounded-[10px] px-2 text-[13px] font-semibold tracking-tight',
                    tab === value ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-muted',
                  )}
                >
                  {TAB_LABEL[value]}
                </button>
              ))}
            </div>
          )}

          {threads.isLoading && !threads.data ? (
            <LoadingBlock />
          ) : threads.isError && !threads.data ? (
            <ErrorState
              message="Could not load chats."
              onRetry={() => void threads.refetch()}
            />
          ) : list.length > 0 ? (
            <div className="-mx-4 overflow-hidden bg-surface">
              {list.map((thread) => (
                <InboxThreadRow
                  key={thread.id}
                  thread={thread}
                  selecting={selecting}
                  selected={selectedIds.has(thread.id) || menuThread?.id === thread.id}
                  canMenu={tab === 'active' && !selecting}
                  onMenu={(rect) => {
                    setMenuThread(thread);
                    setMenuAnchor(rect);
                  }}
                  onToggle={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(thread.id)) next.delete(thread.id);
                      else next.add(thread.id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                searching
                  ? 'No matches'
                  : tab === 'requests'
                    ? 'No requests received'
                    : 'No chats yet'
              }
              message={
                searching
                  ? 'Try another name, order, or message.'
                  : tab === 'requests'
                    ? 'Messages from businesses you don’t know yet land here.'
                    : 'Find a business to start chatting.'
              }
              action={
                !searching && tab === 'active' && !selecting ? (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStartOpen(true)}
                      className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-[15px] font-semibold text-white"
                    >
                      Start a chat
                    </button>
                    <FindInExploreLink label="Find businesses" variant="ghost" fullWidth={false} />
                  </div>
                ) : undefined
              }
            />
          )}
        </>
      )}

      {selecting ? (
        <ChatsInboxDock
          count={selectedIds.size}
          pending={inboxAct.isPending}
          onArchive={() => run('archive')}
          onClear={() => askConfirm('clear', selectedList)}
          onDelete={() => askConfirm('delete', selectedList)}
        />
      ) : null}

      {menuThread ? (
        <ChatsInboxRowMenu
          isGroup={menuThread.type === 'group'}
          pinned={menuThread.pinned}
          muted={menuThread.alertLevel === 'muted'}
          unread={menuThread.unreadCount > 0}
          pending={rowPending}
          anchor={menuAnchor}
          onClose={() => {
            setMenuThread(null);
            setMenuAnchor(null);
          }}
          onPin={() => {
            pinRow.mutate({ id: menuThread.id, pinned: !menuThread.pinned });
          }}
          onUnread={() => {
            const id = menuThread.id;
            setMenuThread(null);
            setMenuAnchor(null);
            run('unread', [id]);
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
            setMenuAnchor(null);
            run('archive', [id]);
          }}
          onClear={() => askConfirm('clear', [menuThread.id])}
          onDelete={() => askConfirm('delete', [menuThread.id])}
          onExitGroup={() => askConfirm('exit', [menuThread.id])}
        />
      ) : null}

      <Sheet
        open={confirm != null}
        onClose={() => {
          setConfirm(null);
          setConfirmIds([]);
        }}
        title={
          confirm === 'exit'
            ? 'Exit this group?'
            : confirm === 'delete'
              ? confirmIds.length > 1
                ? 'Delete chats?'
                : 'Delete chat?'
              : confirmIds.length > 1
                ? 'Clear chats?'
                : 'Clear chat?'
        }
      >
        <p className="text-sm text-muted">
          {confirm === 'exit'
            ? 'Off your inbox. Other shops stay in the group.'
            : confirm === 'clear'
              ? 'Your shop only. They keep the chat and the messages. The chat stays in the list.'
              : 'Your shop only. They keep the chat. New messages from them can bring it back.'}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant={confirm === 'clear' ? 'primary' : 'danger'}
            disabled={inboxAct.isPending || exitGroup.isPending}
            onClick={() => {
              if (confirm === 'exit') {
                const id = confirmIds[0];
                if (id) exitGroup.mutate(id);
                return;
              }
              if (confirm) run(confirm);
            }}
          >
            {confirm === 'exit' ? 'Exit group' : confirm === 'delete' ? 'Delete' : 'Clear'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirm(null);
              setConfirmIds([]);
            }}
          >
            Cancel
          </Button>
        </div>
      </Sheet>

      <StartChatSheet open={startOpen} onClose={() => setStartOpen(false)} />
    </div>
  );
}
