import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  CompanySettingsView,
  CursorPage,
  MessageView,
  ShareLinkView,
  ThreadSummary,
} from '@ekum/domain-types';
import { MessageType, OrderPathPreference } from '@ekum/domain-types';
import { resolveOrderPathPreference } from '@/features/browse/orderPathPreference';
import { rankShareChats } from '@/features/browse/rankShareChats';
import { api, ApiError } from '@/lib/apiClient';
import { canNativeShare, catalogShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { threadVisibilityLabel, threadVisibilitySubtitle } from '@/features/chats/threadVisibilityLabel';
import { FindInExploreLink } from '@/ui/FindInExploreLink';
import { Avatar, Button, LoadingBlock, Sheet, cx } from '@/ui/kit';

export type CatalogShareCollectionItem = {
  collectionId: string;
  name: string;
  image?: string | null;
};

export type CatalogShareProductItem = {
  productId: string;
  name: string;
  image?: string | null;
};

/**
 * Catalogue → chat: post collection_card / product_card into a chosen thread.
 * Same trust gate as Forward (allowForward enforced by API).
 * Stamps orderPathPreference on message metadata for buyer order routing.
 * Quiet text under the chat list: 48h link (any app) when exactly one album or design.
 */
export function CatalogShareSheet({
  open,
  onClose,
  collections = [],
  products = [],
  /** @deprecated use collections */
  items,
  onShared,
}: {
  open: boolean;
  onClose: () => void;
  collections?: CatalogShareCollectionItem[];
  products?: CatalogShareProductItem[];
  items?: CatalogShareCollectionItem[];
  onShared?: () => void;
}) {
  const albumItems = collections.length > 0 ? collections : (items ?? []);
  const designItems = products;
  const total = albumItems.length + designItems.length;
  const { showToast } = useToast();
  const [orderPath, setOrderPath] = useState<'direct' | 'handle'>(OrderPathPreference.Direct);

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: open && total > 0,
  });

  useEffect(() => {
    if (!open || !settings.data) return;
    setOrderPath(resolveOrderPathPreference(settings.data.tradeDefaults));
  }, [open, settings.data]);

  const threads = useQuery({
    queryKey: ['threads', { catalogShare: true }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', { limit: 40, state: 'active' }),
    enabled: open && total > 0,
  });

  const rankedChats = useMemo(
    () => rankShareChats(threads.data?.results ?? []),
    [threads.data?.results],
  );

  const share = useMutation({
    mutationFn: async (threadId: string) => {
      if (total === 0) throw new Error('Nothing to share');
      const metadata = { orderPathPreference: orderPath };
      for (const item of albumItems) {
        await api.post<MessageView>(`/threads/${threadId}/messages`, {
          type: MessageType.CollectionCard,
          referenceId: item.collectionId,
          body: item.name,
          metadata,
        });
      }
      for (const item of designItems) {
        await api.post<MessageView>(`/threads/${threadId}/messages`, {
          type: MessageType.ProductCard,
          referenceId: item.productId,
          body: item.name,
          metadata,
        });
      }
      const title =
        rankedChats.find((row) => row.id === threadId)?.title ??
        rankedChats.find((row) => row.id === threadId)?.counterpart?.name ??
        'chat';
      return title;
    },
    onSuccess: (title) => {
      showToast(total === 1 ? `Shared with ${title}` : `Shared ${total} with ${title}`);
      onShared?.();
      onClose();
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not share.', 'danger');
    },
  });

  const singleCollection = albumItems.length === 1 && designItems.length === 0;
  const singleProduct = designItems.length === 1 && albumItems.length === 0;
  const canLink = singleCollection || singleProduct;
  const makeLink = useMutation({
    mutationFn: () =>
      api.post<ShareLinkView>(
        '/share-links',
        singleCollection
          ? { collectionId: albumItems[0]!.collectionId }
          : { productId: designItems[0]!.productId },
      ),
    onSuccess: async (link) => {
      const url = `${window.location.origin}${link.path}`;
      const copy = catalogShareCopy({ name: link.name, kind: link.kind });
      try {
        const result = await shareOrCopyInvite({
          url,
          title: copy.title,
          text: copy.text,
        });
        if (result === 'copied') showToast('Link copied · 48 hours');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        showToast('Could not share the link.', 'danger');
      }
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not make a link.', 'danger');
    },
  });

  const sheetTitle =
    total > 1
      ? `Share ${total}…`
      : albumItems.length === 1
        ? 'Share album…'
        : designItems.length === 1
          ? 'Share design…'
          : 'Share to…';

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!share.isPending) onClose();
      }}
      title={sheetTitle}
    >
      <div className="mb-3 flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink">When they order</p>
        {(
          [
            {
              value: OrderPathPreference.Direct,
              label: 'Direct',
              hint: 'Buyers order from the design owners',
            },
            {
              value: OrderPathPreference.Handle,
              label: 'I handle',
              hint: 'Buyers order from me',
            },
          ] as const
        ).map((option) => {
          const selected = orderPath === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={share.isPending}
              onClick={() => setOrderPath(option.value)}
              className={cx(
                'w-full rounded-xl border px-3 py-2.5 text-left',
                selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
              )}
            >
              <p className="text-sm font-semibold text-ink">{option.label}</p>
              <p className="text-xs text-muted">{option.hint}</p>
            </button>
          );
        })}
      </div>
      {threads.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="flex max-h-80 flex-col gap-0.5">
          {rankedChats.map((row) => {
            const chatTitle = row.title ?? row.counterpart?.name ?? 'Conversation';
            const visLine = threadVisibilitySubtitle(
              threadVisibilityLabel(row),
              row.counterpart?.city,
            );
            return (
              <button
                key={row.id}
                type="button"
                disabled={share.isPending}
                onClick={() => share.mutate(row.id)}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-foam active:bg-foam disabled:opacity-50"
              >
                <Avatar name={chatTitle} imageUrl={row.counterpart?.logoUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {chatTitle}
                  </span>
                  {visLine ? (
                    <span className="block truncate text-[11px] text-muted">{visLine}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
          {rankedChats.length === 0 ? (
            <div className="flex flex-col gap-3 px-2 py-4 text-center">
              <div>
                <p className="text-sm font-semibold text-ink">No chats yet</p>
                <p className="mt-1 text-sm text-muted">
                  Find a business on Explore, then message them here.
                </p>
              </div>
              <FindInExploreLink />
              {canLink ? (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  disabled={share.isPending || makeLink.isPending}
                  onClick={() => makeLink.mutate()}
                >
                  {makeLink.isPending
                    ? 'Making link…'
                    : canNativeShare()
                      ? 'Share a link · 48 hours'
                      : 'Copy a link · 48 hours'}
                </Button>
              ) : null}
            </div>
          ) : null}
          {rankedChats.length > 0 && canLink ? (
            <button
              type="button"
              disabled={share.isPending || makeLink.isPending}
              onClick={() => makeLink.mutate()}
              className="px-2 pt-3 text-left text-sm text-accent disabled:opacity-50"
            >
              {makeLink.isPending
                ? 'Making link…'
                : canNativeShare()
                  ? 'Share a link · 48 hours'
                  : 'Copy a link · 48 hours'}
            </button>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
