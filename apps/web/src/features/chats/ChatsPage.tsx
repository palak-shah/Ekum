import { useDeferredValue, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type CursorPage, type FollowAskView, type MuteFor, type ThreadSummary } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { FindInExploreLink } from '@/ui/FindInExploreLink';
import { Button, Chip, EmptyState, ErrorState, FilterRail, LoadingBlock, SearchInput, Sheet, cx } from '@/ui/kit';
import { ListSearchRow } from '@/ui/ListSearchRow';
import { ChevronRightIcon } from '@/ui/icons';
import { subscribeChatsNewChat } from './chatsNewChat';
import { chatMediaKindChrome } from './chatMediaKindChrome';
import { invalidateFollowCatalog } from '@/features/network/invalidateFollowCatalog';
import { StartChatSheet } from './StartChatSheet';
import { ChatsInboxRowMenu } from './ChatsInboxRowMenu';
import { InboxThreadRow } from './InboxThreadRow';
import { useToast } from '@/ui/Toast';
import { FollowAskDecideRow, FollowAskHeader } from '@/features/chats/FollowAskDecideRow';
import {
  type ChatsInboxChip,
  chatsInboxChipBadge,
  chatsInboxChipCount,
  chatsInboxEmptyCopy,
  chatsInboxFromSearch,
  filterActiveInbox,
  rememberChatsInbox,
} from './chatsInboxFilter';

type InboxAction = 'archive' | 'clear' | 'delete' | 'unread';

const CHIP_LABEL: Record<ChatsInboxChip, string> = {
  all: 'All',
  unread: 'Unread',
  groups: 'Groups',
  requests: 'Requests',
};

function useInboxThreads(inbox: 'active' | 'requests', q: string | undefined, live: boolean) {
  return useQuery({
    queryKey: ['threads', { tab: inbox, q }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', {
        limit: 40,
        state: inbox === 'requests' ? 'pending' : 'active',
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
  { kind: 'complaints', label: 'Complaints' },
];

export function ChatsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chip, setChip] = useState<ChatsInboxChip>(() => chatsInboxFromSearch(searchParams.toString()));
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const [startOpen, setStartOpen] = useState(false);

  useEffect(() => subscribeChatsNewChat(() => setStartOpen(true)), []);
  const [confirm, setConfirm] = useState<'clear' | 'delete' | 'exit' | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [menuThread, setMenuThread] = useState<ThreadSummary | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    bottom: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    const nextChip = chatsInboxFromSearch(searchParams.toString());
    setChip(nextChip);
    rememberChatsInbox(nextChip);
    setConfirm(null);
    setConfirmIds([]);
    setMenuThread(null);
    setMenuAnchor(null);
  }, [searchParams]);

  const q = deferredQuery || undefined;
  const live = !deferredQuery;
  const activeInbox = useInboxThreads('active', q, live);
  const requestInbox = useInboxThreads('requests', q, live);
  const asks = useQuery({
    queryKey: ['follows', 'asks'],
    queryFn: () => api.get<FollowAskView[]>('/follows/asks'),
  });
  const decideAsk = useMutation({
    mutationFn: (payload: { followerCompanyId: string; decision: 'look' | 'pack' | 'deny' }) =>
      api.post('/follows/decide', payload),
    onSuccess: () => {
      invalidateFollowCatalog(queryClient);
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not update this ask.', 'danger'),
  });
  const threads = chip === 'requests' ? requestInbox : activeInbox;
  const list =
    chip === 'requests'
      ? (requestInbox.data?.results ?? [])
      : filterActiveInbox(activeInbox.data?.results ?? [], chip);
  const searching = Boolean(deferredQuery);
  const showInChats = searchFocused && !query.trim();

  const inboxAct = useMutation({
    mutationFn: (payload: { action: InboxAction; threadIds: string[] }) =>
      api.post<{ ok: true; count: number }>('/threads/inbox-actions', payload),
    onSuccess: (_data, vars) => {
      setConfirm(null);
      setConfirmIds([]);
      setMenuThread(null);
      setMenuAnchor(null);
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

  const run = (action: InboxAction, threadIds?: string[]) => {
    const ids = threadIds ?? confirmIds;
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
    <div className="flex flex-col gap-2.5">
      <ListSearchRow
        search={
          <SearchInput
            compact
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
      />

      {showInChats ? (
        <section data-testid="chats-in-chats" className="flex flex-col gap-1">
          <h2 className="px-0.5 text-[13px] font-semibold text-muted">In chats</h2>
          <ul className="-mx-4 overflow-hidden bg-surface">
            {IN_CHATS.map((item) => {
              const { Icon, badge } = chatMediaKindChrome(item.kind);
              return (
                <li key={item.kind}>
                  <Link
                    to={`/chats/find?kind=${item.kind}`}
                    data-testid={`chats-find-${item.kind}`}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-canvas active:bg-canvas"
                  >
                    <span
                      className={cx(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        badge,
                      )}
                    >
                      <Icon width={18} height={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">{item.label}</span>
                    <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <>
          <FilterRail className="gap-1.5">
            {(['all', 'unread', 'groups', 'requests'] as const).map((value) => {
              const badge = chatsInboxChipBadge(
                chatsInboxChipCount(value, {
                  active: activeInbox.data?.results ?? [],
                  pendingCount: requestInbox.data?.results.length ?? 0,
                  askCount: asks.data?.length ?? 0,
                }),
              );
              return (
                <Chip
                  key={value}
                  compact
                  active={chip === value}
                  onClick={() => {
                    setChip(value);
                    const next = new URLSearchParams(searchParams);
                    if (value === 'all') next.delete('inbox');
                    else next.set('inbox', value);
                    setSearchParams(next, { replace: true });
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {CHIP_LABEL[value]}
                    {badge ? (
                      <span
                        className={cx(
                          'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                          chip === value ? 'bg-white/25 text-white' : 'bg-badge text-white',
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </span>
                </Chip>
              );
            })}
          </FilterRail>

          {threads.isLoading && !threads.data ? (
            <LoadingBlock />
          ) : threads.isError && !threads.data ? (
            <ErrorState
              message="Could not load chats."
              onRetry={() => void threads.refetch()}
            />
          ) : list.length > 0 || (chip === 'requests' && (asks.data?.length ?? 0) > 0) ? (
            <div className="-mx-4 overflow-hidden bg-surface">
              {chip === 'requests'
                ? (asks.data ?? []).map((ask) => (
                    <div
                      key={ask.company.id}
                      className="flex flex-col gap-1.5 px-4 py-3"
                      data-testid={`chats-see-packs-ask-${ask.company.id}`}
                    >
                      <FollowAskHeader
                        name={ask.company.name}
                        logoUrl={ask.company.logoUrl}
                        avatarSize={48}
                      />
                      <FollowAskDecideRow
                        disabled={decideAsk.isPending}
                        onAllow={(decision) =>
                          decideAsk.mutate({ followerCompanyId: ask.company.id, decision })
                        }
                        onDecline={() =>
                          decideAsk.mutate({ followerCompanyId: ask.company.id, decision: 'deny' })
                        }
                      />
                    </div>
                  ))
                : null}
              {list.map((thread) => (
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
                  onArchive={() => run('archive', [thread.id])}
                  onToggle={() => undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={chatsInboxEmptyCopy(chip, searching).title}
              message={chatsInboxEmptyCopy(chip, searching).message}
              action={
                !searching && chip === 'all' ? (
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

      {menuThread ? (
        <ChatsInboxRowMenu
          open
          title={menuThread.title || menuThread.counterpart?.name || 'Chat'}
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
          onBlock={
            menuThread.counterpart
              ? () => {
                  const id = menuThread.id;
                  const companyId = menuThread.counterpart!.id;
                  setMenuThread(null);
                  setMenuAnchor(null);
                  void (async () => {
                    try {
                      await api.post(`/connections/company/${companyId}/block`, {});
                      await api.post(`/threads/${id}/decline`, {});
                      void queryClient.invalidateQueries({ queryKey: ['threads'] });
                      void queryClient.invalidateQueries({ queryKey: ['connections'] });
                      showToast('Blocked');
                    } catch (err) {
                      showToast(
                        err instanceof ApiError ? err.message : 'Could not block this shop.',
                        'danger',
                      );
                    }
                  })();
                }
              : undefined
          }
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
              ? 'Delete chat?'
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
