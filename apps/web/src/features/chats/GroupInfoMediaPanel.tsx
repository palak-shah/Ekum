import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  documentFromMessage,
  documentTypeCue,
  photoUrlsFromMessage,
  type CursorPage,
  type MessageView,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { timeAgo } from '@/lib/format';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { Chip, EmptyState, ErrorState, LoadingBlock, cx } from '@/ui/kit';
import { ChevronRightIcon } from '@/ui/icons';
import { chatMediaKindChrome } from './chatMediaKindChrome';
import {
  GROUP_MEDIA_KINDS,
  GROUP_MEDIA_LABEL,
  type GroupMediaKind,
} from './groupInfoTabs';

const EMPTY: Record<GroupMediaKind, { title: string; message: string }> = {
  photos: { title: 'No photos yet', message: 'Photos shared in this group show up here.' },
  documents: { title: 'No documents yet', message: 'PDFs and files shared here show up here.' },
  designs: { title: 'No designs yet', message: 'Designs shared in this group show up here.' },
  collections: { title: 'No collections yet', message: 'Packs shared in this group show up here.' },
};

type PhotoCell = { key: string; url: string; messageId: string; createdAt: string };

function expandPhotos(messages: MessageView[]): PhotoCell[] {
  const cells: PhotoCell[] = [];
  for (const message of messages) {
    photoUrlsFromMessage(message).forEach((raw, index) => {
      const url = toAbsoluteMediaUrl(raw);
      if (!url) return;
      cells.push({
        key: `${message.id}-${index}`,
        url,
        messageId: message.id,
        createdAt: message.createdAt,
      });
    });
  }
  return cells;
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function GroupInfoMediaPanel({
  threadId,
  kind,
  onPickKind,
}: {
  threadId: string;
  kind: GroupMediaKind | null;
  onPickKind: (kind: GroupMediaKind | null) => void;
}) {
  const navigate = useNavigate();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const list = useInfiniteQuery({
    queryKey: ['thread', threadId, 'messages', kind ?? 'none'],
    initialPageParam: null as string | null,
    enabled: Boolean(kind),
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<MessageView>>(`/threads/${threadId}/messages`, {
        limit: 40,
        view: kind ?? 'photos',
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => last.nextCursor,
  });

  const messages = useMemo(
    () => list.data?.pages.flatMap((page) => page.results) ?? [],
    [list.data],
  );
  const photoCells = useMemo(
    () => (kind === 'photos' ? expandPhotos(messages) : []),
    [kind, messages],
  );
  const photoGroups = useMemo(() => {
    const groups: { key: string; label: string; items: PhotoCell[]; startIndex: number }[] = [];
    let cursor = 0;
    for (const cell of photoCells) {
      const key = monthKey(cell.createdAt);
      const last = groups[groups.length - 1];
      if (!last || last.key !== key) {
        groups.push({ key, label: monthLabel(cell.createdAt), items: [cell], startIndex: cursor });
      } else {
        last.items.push(cell);
      }
      cursor += 1;
    }
    return groups;
  }, [photoCells]);

  if (!kind) {
    return (
      <ul className="-mx-4 overflow-hidden bg-surface" data-testid="group-info-media-kinds">
        {GROUP_MEDIA_KINDS.map((row) => {
          const { Icon, badge } = chatMediaKindChrome(row);
          return (
            <li key={row}>
              <button
                type="button"
                data-testid={`group-info-media-${row}`}
                className="flex w-full items-center gap-3 border-b border-line/70 px-4 py-3.5 text-left last:border-b-0 hover:bg-canvas"
                onClick={() => onPickKind(row)}
              >
                <span
                  className={cx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    badge,
                  )}
                >
                  <Icon width={20} height={20} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">
                  {GROUP_MEDIA_LABEL[row]}
                </span>
                <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const empty = EMPTY[kind];
  const viewerCell =
    viewerIndex != null && viewerIndex >= 0 && viewerIndex < photoCells.length
      ? photoCells[viewerIndex]
      : null;

  return (
    <div className="flex flex-col gap-3">
      <Chip active onClick={() => onPickKind(null)}>
        {GROUP_MEDIA_LABEL[kind]} ×
      </Chip>
      {list.isLoading && !list.data ? (
        <LoadingBlock label={`Loading ${GROUP_MEDIA_LABEL[kind].toLowerCase()}…`} />
      ) : list.isError ? (
        <ErrorState message={`Could not load ${GROUP_MEDIA_LABEL[kind].toLowerCase()}.`} />
      ) : kind === 'photos' && photoCells.length === 0 ? (
        <EmptyState title={empty.title} message={empty.message} />
      ) : kind !== 'photos' && messages.length === 0 ? (
        <EmptyState title={empty.title} message={empty.message} />
      ) : kind === 'photos' ? (
        <div className="flex flex-col gap-4">
          {photoGroups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 px-0.5 text-[13px] font-semibold text-muted">{group.label}</h2>
              <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl">
                {group.items.map((cell, localIndex) => (
                  <button
                    key={cell.key}
                    type="button"
                    className="relative aspect-square bg-linen"
                    data-testid="group-info-photo"
                    aria-label="Photo"
                    onClick={() => setViewerIndex(group.startIndex + localIndex)}
                  >
                    <img src={cell.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="group-info-media-list">
          {messages.map((message) => {
            const doc = documentFromMessage(message);
            const cue =
              kind === 'documents' ? documentTypeCue(doc?.contentType ?? '', doc?.fileName) : null;
            const title =
              kind === 'documents'
                ? doc?.fileName?.trim() || 'Document'
                : message.reference?.name?.trim() ||
                  (kind === 'collections' ? 'Collection' : 'Design');
            const thumb =
              kind === 'documents' && doc?.contentType?.startsWith('image/') && doc.url
                ? doc.url
                : (message.reference?.image ?? message.reference?.images?.[0] ?? null);
            const { Icon, badge } = chatMediaKindChrome(kind);
            return (
              <li key={message.id}>
                <Link
                  to={`/chats/${threadId}?message=${encodeURIComponent(message.id)}`}
                  data-testid="group-info-media-row"
                  className={cx(
                    'flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5',
                    'hover:bg-foam',
                  )}
                >
                  <div
                    className={cx(
                      'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[11px] font-semibold',
                      thumb ? 'bg-linen text-muted' : badge,
                    )}
                  >
                    {thumb ? (
                      <img
                        src={toAbsoluteMediaUrl(thumb) ?? thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : cue ? (
                      cue
                    ) : (
                      <Icon width={22} height={22} aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{title}</p>
                    {cue ? <p className="truncate text-sm text-muted">{cue}</p> : null}
                  </div>
                  <p className="shrink-0 text-[10px] text-muted">{timeAgo(message.createdAt)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {list.hasNextPage ? (
        <button
          type="button"
          className="mx-auto text-sm font-semibold text-accent disabled:opacity-40"
          disabled={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {list.isFetchingNextPage ? 'Loading…' : 'Show more'}
        </button>
      ) : null}
      {kind === 'photos' && viewerIndex != null && photoCells.length > 0 ? (
        <PhotoViewer
          open
          urls={photoCells.map((cell) => cell.url)}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          headerAction={
            viewerCell
              ? {
                  label: 'Chat',
                  testId: 'photo-viewer-go-chat',
                  onClick: () => {
                    navigate(
                      `/chats/${threadId}?message=${encodeURIComponent(viewerCell.messageId)}`,
                    );
                  },
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
