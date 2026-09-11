import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  ConnectionView,
  MessageView,
  ShareLinkView,
  StartDirectThreadResult,
} from '@ekum/domain-types';
import { MessageType } from '@ekum/domain-types';
import {
  catalogShareToastLabel,
  dedupeCompanyIds,
  shouldOpenChatAfterCatalogShare,
} from '@/features/browse/catalogShareTargets';
import { api, ApiError } from '@/lib/apiClient';
import { canNativeShare, catalogShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, InlineNotice, LoadingBlock, Sheet } from '@/ui/kit';

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
 * Catalogue → chat(s): multi-select companies (Find on Ekum, Clear), then post
 * collection_card / product_card into each DM. No buyer groups / Broadcast.
 * Quiet 48h link when exactly one album or design.
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
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedCompanyIds([]);
  }, [open]);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open && total > 0,
  });

  const connectionName = (companyId: string) =>
    connections.data?.find((row) => row.company.id === companyId)?.company.name ?? null;

  const postCardsToThread = async (threadId: string) => {
    for (const item of albumItems) {
      await api.post<MessageView>(`/threads/${threadId}/messages`, {
        type: MessageType.CollectionCard,
        referenceId: item.collectionId,
        body: item.name,
      });
    }
    for (const item of designItems) {
      await api.post<MessageView>(`/threads/${threadId}/messages`, {
        type: MessageType.ProductCard,
        referenceId: item.productId,
        body: item.name,
      });
    }
  };

  const share = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const targets = dedupeCompanyIds(companyIds);
      if (total === 0) throw new Error('Nothing to share');
      if (targets.length === 0) throw new Error('Pick at least one business');
      setError(null);
      const threadIds: string[] = [];
      for (const companyId of targets) {
        const thread = await api.post<StartDirectThreadResult>('/threads/direct', { companyId });
        await postCardsToThread(thread.id);
        threadIds.push(thread.id);
      }
      return {
        threadIds,
        recipientCount: targets.length,
        singleName: targets.length === 1 ? connectionName(targets[0]!) : null,
      };
    },
    onSuccess: ({ threadIds, recipientCount, singleName }) => {
      showToast(catalogShareToastLabel({ recipientCount, singleName }));
      onShared?.();
      onClose();
      if (shouldOpenChatAfterCatalogShare(recipientCount) && threadIds[0]) {
        navigate(`/chats/${threadIds[0]}`);
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not share.');
    },
  });

  const singleCollection = albumItems.length === 1 && designItems.length === 0;
  const singleProduct = designItems.length === 1 && albumItems.length === 0;
  const canLink = singleCollection || singleProduct;
  const makeLink = useMutation({
    mutationFn: () => {
      setError(null);
      return api.post<ShareLinkView>(
        '/share-links',
        singleCollection
          ? { collectionId: albumItems[0]!.collectionId }
          : { productId: designItems[0]!.productId },
      );
    },
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
        setError('Could not share the link.');
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not make a link.');
    },
  });

  const sheetTitle =
    total > 1
      ? `Share ${total}…`
      : albumItems.length === 1
        ? 'Share collection…'
        : designItems.length === 1
          ? 'Share design…'
          : 'Share to…';

  const selectedCount = selectedCompanyIds.length;
  const busy = share.isPending || makeLink.isPending;

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!share.isPending) onClose();
      }}
      title={sheetTitle}
      footer={
        total > 0 ? (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              fullWidth
              disabled={busy || selectedCount < 1}
              onClick={() => share.mutate(selectedCompanyIds)}
              data-testid="catalog-share-send"
            >
              {share.isPending
                ? 'Sharing…'
                : selectedCount > 1
                  ? `Share with ${selectedCount}`
                  : 'Share'}
            </Button>
            {canLink ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => makeLink.mutate()}
                className="text-center text-sm text-accent disabled:opacity-50"
                data-testid="catalog-share-link"
              >
                {makeLink.isPending
                  ? 'Making link…'
                  : canNativeShare()
                    ? 'Share a link · 48 hours'
                    : 'Copy a link · 48 hours'}
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      {error ? <InlineNotice message={error} className="mb-3" /> : null}
      {total < 1 ? (
        <p className="text-sm text-muted">Nothing to share.</p>
      ) : connections.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="flex max-h-[min(24rem,55vh)] flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">
              {selectedCount} selected · posts into chat
            </p>
            {selectedCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-accent disabled:opacity-50"
                disabled={busy}
                onClick={() => setSelectedCompanyIds([])}
                data-testid="catalog-share-clear"
              >
                Clear
              </button>
            ) : null}
          </div>
          <ConnectionPicker
            mode="multi"
            embedded
            label=""
            connections={connections.data ?? []}
            value={selectedCompanyIds}
            onChange={setSelectedCompanyIds}
            emptyMessage="No connections yet — find a business below."
            findOnEkum
            onMessageFound={(companyId) => {
              setSelectedCompanyIds((prev) => dedupeCompanyIds([...prev, companyId]));
            }}
          />
        </div>
      )}
    </Sheet>
  );
}
