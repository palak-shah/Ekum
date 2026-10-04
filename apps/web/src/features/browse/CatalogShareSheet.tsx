import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  BroadcastListView,
  ConnectionView,
  MessageView,
  ShareLinkView,
  StartDirectThreadResult,
} from '@ekum/domain-types';
import { MessageType } from '@ekum/domain-types';
import {
  catalogShareCanLink,
  catalogShareCopiedToast,
  catalogShareInviteText,
  catalogShareLinkBodies,
} from '@/features/browse/catalogShareLinkUnits';
import {
  catalogShareToastLabel,
  catalogShareRecipientIds,
  dedupeCompanyIds,
  shouldOpenChatAfterCatalogShare,
} from '@/features/browse/catalogShareTargets';
import { api, ApiError } from '@/lib/apiClient';
import { canNativeShare, catalogShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { uniqueConnectionsByCompany } from '@/ui/uniqueConnections';
import { Button, Field, InlineNotice, LoadingBlock, Sheet, TextArea, cx } from '@/ui/kit';

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
 * Catalogue → chat(s): companies and, when they exist, buyer groups (shortcut).
 * Union + unique shop: one DM even if the shop sits in two groups.
 * Posts collection_card / product_card / design_album. Not Broadcast compose.
 * Quiet 48h link: one door per chat unit (album / design / design album). Mix keeps the row.
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
  const [readyInvite, setReadyInvite] = useState<string | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReadyInvite(null);
    setSelectedCompanyIds([]);
    setSelectedGroupIds([]);
  }, [open]);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open && total > 0,
  });

  const buyerGroups = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled: open && total > 0,
  });

  const shareableGroups = useMemo(
    () => (buyerGroups.data ?? []).filter((group) => group.memberCompanyIds.length > 0),
    [buyerGroups.data],
  );

  const eligibleCompanyIds = useMemo(
    () => uniqueConnectionsByCompany(connections.data ?? []).map((row) => row.company.id),
    [connections.data],
  );

  const recipientIds = useMemo(
    () =>
      catalogShareRecipientIds({
        selectedCompanyIds,
        selectedGroupIds,
        groups: shareableGroups,
        eligibleCompanyIds,
      }),
    [selectedCompanyIds, selectedGroupIds, shareableGroups, eligibleCompanyIds],
  );

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
    if (designItems.length >= 2) {
      const productIds = designItems.map((item) => item.productId);
      await api.post<MessageView>(`/threads/${threadId}/messages`, {
        type: MessageType.DesignAlbum,
        metadata: { productIds },
        body: `${productIds.length} designs`,
      });
    } else {
      for (const item of designItems) {
        await api.post<MessageView>(`/threads/${threadId}/messages`, {
          type: MessageType.ProductCard,
          referenceId: item.productId,
          body: item.name,
        });
      }
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

  const linkBodies = catalogShareLinkBodies({
    collectionIds: albumItems.map((item) => item.collectionId),
    productIds: designItems.map((item) => item.productId),
  });
  const canLink = catalogShareCanLink({
    collectionIds: albumItems.map((item) => item.collectionId),
    productIds: designItems.map((item) => item.productId),
  });
  const makeLink = useMutation({
    mutationFn: async () => {
      setError(null);
      setReadyInvite(null);
      if (linkBodies.length < 1) throw new Error('Nothing to share');
      const links: ShareLinkView[] = [];
      for (const body of linkBodies) {
        links.push(await api.post<ShareLinkView>('/share-links', body));
      }
      return links;
    },
    onSuccess: async (links) => {
      const first = links[0];
      if (!first) return;
      const origin = window.location.origin;
      const urls = links.map((link) => `${origin}${link.path}`);
      const copy = catalogShareCopy({
        name: first.name,
        kind: first.kind,
        companyName: first.companyName,
      });
      const text = catalogShareInviteText([copy.text], urls);
      try {
        const result = await shareOrCopyInvite({
          url: urls[0]!,
          title: copy.title,
          text,
          copyText: links.length > 1 ? text : undefined,
          preferShareSheet: canNativeShare(),
        });
        if (result === 'copied') showToast(catalogShareCopiedToast(links.length));
        if (result === 'manual') setReadyInvite(text);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setReadyInvite(text);
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not make a link.');
    },
  });

  const sheetTitle =
    designItems.length >= 2 && albumItems.length === 0
      ? `Share ${designItems.length} designs…`
      : total > 1
        ? `Share ${total}…`
        : albumItems.length === 1
          ? 'Share collection…'
          : designItems.length === 1
            ? 'Share design…'
            : 'Share to…';

  const selectedCount = recipientIds.length;
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
              onClick={() => share.mutate(recipientIds)}
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
      {readyInvite ? (
        <div className="mb-3">
          <Field label="48-hour links" hint="Select the text and copy.">
            <TextArea
              readOnly
              value={readyInvite}
              rows={Math.min(8, readyInvite.split('\n').length + 1)}
              data-testid="catalog-share-ready-copy"
            />
          </Field>
        </div>
      ) : null}
      {total < 1 ? (
        <p className="text-sm text-muted">Nothing to share.</p>
      ) : connections.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="ekum-no-scrollbar flex max-h-[min(24rem,55vh)] flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">
              {selectedCount} selected · posts into chat
            </p>
            {selectedCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-accent disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setSelectedCompanyIds([]);
                  setSelectedGroupIds([]);
                }}
                data-testid="catalog-share-clear"
              >
                Clear
              </button>
            ) : null}
          </div>
          {shareableGroups.length > 0 ? (
            <div className="flex flex-col gap-1.5" data-testid="catalog-share-groups">
              <p className="text-xs font-semibold text-ink">Buyer groups</p>
              {shareableGroups.map((group) => {
                const selected = selectedGroupIds.includes(group.id);
                const n = group.memberCompanyIds.length;
                return (
                  <button
                    key={group.id}
                    type="button"
                    data-testid={`catalog-share-group-${group.id}`}
                    disabled={busy}
                    onClick={() =>
                      setSelectedGroupIds((prev) =>
                        prev.includes(group.id)
                          ? prev.filter((id) => id !== group.id)
                          : [...prev, group.id],
                      )
                    }
                    className={cx(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
                      selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{group.name}</p>
                      <p className="truncate text-xs text-muted">
                        {n} {n === 1 ? 'business' : 'businesses'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {selected ? 'Selected' : 'Add'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
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
