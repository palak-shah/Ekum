import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  crossChatFindKindValues,
  documentFromMessage,
  documentTypeCue,
  photoUrlsFromMessage,
  type CrossChatFindItemView,
  type CrossChatFindKind,
  type CursorPage,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Chip, EmptyState, ErrorState, LoadingBlock, TextInput, cx } from '@/ui/kit';
import { timeAgo } from '@/lib/format';

const KIND_LABEL: Record<CrossChatFindKind, string> = {
  photos: 'Photos',
  documents: 'Documents',
  collections: 'Collections',
  designs: 'Designs',
};

const EMPTY_COPY: Record<CrossChatFindKind, { title: string; message: string }> = {
  photos: { title: 'No photos in chats yet', message: 'Photos shared in chats show up here.' },
  documents: {
    title: 'No documents in chats yet',
    message: 'PDFs and files shared in chats show up here.',
  },
  collections: {
    title: 'No collections in chats yet',
    message: 'Packs shared in chats show up here.',
  },
  designs: {
    title: 'No designs in chats yet',
    message: 'Designs shared in chats show up here.',
  },
};

function parseKind(raw: string | null): CrossChatFindKind | null {
  if (!raw) return null;
  return (crossChatFindKindValues as readonly string[]).includes(raw)
    ? (raw as CrossChatFindKind)
    : null;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function chatTitle(row: CrossChatFindItemView): string {
  return row.threadTitle?.trim() || row.counterpartName?.trim() || 'Chat';
}

function rowLabel(row: CrossChatFindItemView, kind: CrossChatFindKind): string {
  const msg = row.message;
  if (kind === 'documents') {
    const doc = documentFromMessage(msg);
    return doc?.fileName?.trim() || 'Document';
  }
  if (kind === 'collections' || kind === 'designs') {
    return msg.reference?.name?.trim() || (kind === 'collections' ? 'Collection' : 'Design');
  }
  return 'Photo';
}

function thumbUrl(row: CrossChatFindItemView, kind: CrossChatFindKind): string | null {
  if (kind === 'photos') {
    return photoUrlsFromMessage(row.message)[0] ?? null;
  }
  if (kind === 'documents') {
    const doc = documentFromMessage(row.message);
    if (doc?.contentType?.startsWith('image/') && doc.url) return doc.url;
    return null;
  }
  return row.message.reference?.image ?? row.message.reference?.images?.[0] ?? null;
}

export function ChatFindPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind = parseKind(params.get('kind'));
  const [query, setQuery] = useState(params.get('q') ?? '');
  const deferredQ = useDeferredValue(query.trim());

  const find = useInfiniteQuery({
    queryKey: ['threads', 'messages', 'find', kind, deferredQ || undefined],
    enabled: Boolean(kind),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<CrossChatFindItemView>>('/threads/messages/find', {
        kind: kind!,
        limit: 40,
        ...(deferredQ ? { q: deferredQ } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: (previous) => previous,
  });

  const rows = useMemo(
    () => find.data?.pages.flatMap((page) => page.results) ?? [],
    [find.data],
  );

  const photoGroups = useMemo(() => {
    if (kind !== 'photos') return [];
    const groups: { key: string; label: string; items: CrossChatFindItemView[] }[] = [];
    for (const row of rows) {
      const key = monthKey(row.message.createdAt);
      const last = groups[groups.length - 1];
      if (last?.key === key) {
        last.items.push(row);
      } else {
        groups.push({ key, label: monthLabel(row.message.createdAt), items: [row] });
      }
    }
    return groups;
  }, [kind, rows]);

  if (!kind) {
    return (
      <>
        <PageHeader title="In chats" onBack={() => navigate('/chats')} />
        <EmptyState title="Pick a type" message="Open Photos, Documents, Collections, or Designs from Chats search." />
      </>
    );
  }

  const clearKind = () => navigate('/chats');
  const syncQ = (value: string) => {
    setQuery(value);
    const next = new URLSearchParams(params);
    if (value.trim()) next.set('q', value.trim());
    else next.delete('q');
    setParams(next, { replace: true });
  };

  const empty = EMPTY_COPY[kind];

  return (
    <div className="flex flex-col gap-3 pb-24">
      <PageHeader title={KIND_LABEL[kind]} onBack={() => navigate('/chats')} />
      <div className="flex items-center gap-2">
        <Chip active onClick={clearKind}>
          {KIND_LABEL[kind]} ×
        </Chip>
        <TextInput
          className="min-w-0 flex-1"
          value={query}
          onChange={(event) => syncQ(event.target.value)}
          placeholder={`Search ${KIND_LABEL[kind].toLowerCase()}`}
          aria-label={`Search ${KIND_LABEL[kind].toLowerCase()} in chats`}
          autoComplete="off"
          data-testid="chat-find-search"
        />
      </div>

      {find.isLoading && !find.data ? (
        <LoadingBlock label={`Loading ${KIND_LABEL[kind].toLowerCase()}…`} />
      ) : find.isError ? (
        <ErrorState message={`Could not load ${KIND_LABEL[kind].toLowerCase()}.`} />
      ) : rows.length === 0 ? (
        <EmptyState title={empty.title} message={empty.message} />
      ) : kind === 'photos' ? (
        <div className="flex flex-col gap-4">
          {photoGroups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 px-0.5 text-[13px] font-semibold text-muted">{group.label}</h2>
              <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl">
                {group.items.map((row) => {
                  const url = thumbUrl(row, 'photos');
                  return (
                    <Link
                      key={row.message.id}
                      to={`/chats/${row.threadId}?message=${encodeURIComponent(row.message.id)}`}
                      className="relative aspect-square bg-linen"
                      data-testid="chat-find-photo"
                      aria-label={`Photo in ${chatTitle(row)}`}
                    >
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="chat-find-list">
          {rows.map((row) => {
            const title = chatTitle(row);
            const label = rowLabel(row, kind);
            const thumb = thumbUrl(row, kind);
            const cue =
              kind === 'documents'
                ? documentTypeCue(
                    documentFromMessage(row.message)?.contentType ?? '',
                    documentFromMessage(row.message)?.fileName,
                  )
                : null;
            return (
              <li key={row.message.id}>
                <Link
                  to={`/chats/${row.threadId}?message=${encodeURIComponent(row.message.id)}`}
                  className={cx(
                    'flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5',
                    'hover:bg-foam active:bg-linen',
                  )}
                  data-testid="chat-find-row"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linen text-[11px] font-semibold text-muted">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      cue ?? KIND_LABEL[kind].slice(0, 3)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{title}</p>
                    <p className="truncate text-sm text-muted">
                      {cue ? `${cue} · ${label}` : label}
                    </p>
                  </div>
                  <p className="shrink-0 text-[10px] text-muted">{timeAgo(row.message.createdAt)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {find.hasNextPage ? (
        <button
          type="button"
          className="mx-auto text-sm font-semibold text-accent disabled:opacity-40"
          disabled={find.isFetchingNextPage}
          onClick={() => void find.fetchNextPage()}
        >
          {find.isFetchingNextPage ? 'Loading…' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
}
