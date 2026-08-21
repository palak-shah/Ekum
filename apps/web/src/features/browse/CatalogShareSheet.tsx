import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { CompanySettingsView, CursorPage, MessageView, ThreadSummary } from '@ekum/domain-types';
import { MessageType, OrderPathPreference } from '@ekum/domain-types';
import { resolveOrderPathPreference } from '@/features/browse/orderPathPreference';
import { api, ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import { Avatar, LoadingBlock, Sheet, cx } from '@/ui/kit';

export type CatalogShareCollectionItem = {
  collectionId: string;
  name: string;
};

export type CatalogShareProductItem = {
  productId: string;
  name: string;
};

/**
 * Catalogue → chat: post collection_card / product_card into a chosen thread.
 * Same trust gate as Forward (allowForward enforced by API).
 * Stamps orderPathPreference on message metadata for buyer order routing.
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
        threads.data?.results.find((row) => row.id === threadId)?.title ??
        threads.data?.results.find((row) => row.id === threadId)?.counterpart?.name ??
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
                'rounded-xl px-3 py-2.5 text-left',
                selected ? 'bg-accent/10 ring-1 ring-accent' : 'border border-line',
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
        <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {(threads.data?.results ?? []).map((row) => {
            const chatTitle = row.title ?? row.counterpart?.name ?? 'Conversation';
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
                  {row.counterpart?.city ? (
                    <span className="block truncate text-[11px] text-muted">
                      {row.counterpart.city}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
          {(threads.data?.results.length ?? 0) === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">No chats yet</p>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
