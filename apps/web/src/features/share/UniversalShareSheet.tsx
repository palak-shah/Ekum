import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BroadcastListView,
  ConnectionView,
  MessageView,
  ShareLinkView,
  StartDirectThreadResult,
} from '@ekum/domain-types';
import { MessageType } from '@ekum/domain-types';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
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
import { postCatalogCardsToThread } from '@/features/browse/postCatalogCardsToThread';
import {
  companyProfileShareBody,
  companyProfileShareUrl,
} from '@/features/company/companyProfileShare';
import { ShareComposerBar } from '@/features/share/ShareComposerBar';
import { api, ApiError } from '@/lib/apiClient';
import {
  canNativeShare,
  catalogShareCopy,
  companyShareCopy,
  shareMessageText,
  shareOrCopyInvite,
} from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { uniqueConnectionsByCompany } from '@/ui/uniqueConnections';
import { Field, InlineNotice, LoadingBlock, Sheet, TextArea, cx } from '@/ui/kit';

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

export type SharePayload =
  | {
      kind: 'catalog';
      collections?: CatalogShareCollectionItem[];
      products?: CatalogShareProductItem[];
      /** @deprecated use collections */
      items?: CatalogShareCollectionItem[];
      onShared?: () => void;
    }
  | {
      kind: 'company';
      companyId: string;
      companyName: string;
    };

function catalogItems(payload: Extract<SharePayload, { kind: 'catalog' }>) {
  const albums =
    (payload.collections?.length ?? 0) > 0 ? payload.collections! : (payload.items ?? []);
  const designs = payload.products ?? [];
  return { albums, designs, total: albums.length + designs.length };
}

function sheetTitleFor(payload: SharePayload): string {
  if (payload.kind === 'company') return 'Share profile…';
  const { albums, designs, total } = catalogItems(payload);
  if (designs.length >= 2 && albums.length === 0) return `Share ${designs.length} designs…`;
  if (total > 1) return `Share ${total}…`;
  if (albums.length === 1) return 'Share collection…';
  if (designs.length === 1) return 'Share design…';
  return 'Share to…';
}

/**
 * Fullscreen Share: pick recipients → optional note → Send (primary).
 * Quieter native ShareIcon for outside link. Quiet Create group text.
 */
export function UniversalShareSheet({
  open,
  onClose,
  payload,
}: {
  open: boolean;
  onClose: () => void;
  payload: SharePayload;
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [readyInvite, setReadyInvite] = useState<string | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [nativePending, setNativePending] = useState(false);

  const catalog = payload.kind === 'catalog' ? catalogItems(payload) : null;
  const companyId = payload.kind === 'company' ? payload.companyId : null;
  const enabled = open && (payload.kind === 'company' ? Boolean(companyId) : (catalog?.total ?? 0) > 0);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReadyInvite(null);
    setSelectedCompanyIds([]);
    setSelectedGroupIds([]);
    setNote('');
    setCreateGroupOpen(false);
    setNativePending(false);
  }, [open, payload.kind]);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled,
  });

  const buyerGroups = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled,
  });

  const shareableGroups = useMemo(
    () => (buyerGroups.data ?? []).filter((group) => group.memberCompanyIds.length > 0),
    [buyerGroups.data],
  );

  const eligibleCompanyIds = useMemo(() => {
    const rows = uniqueConnectionsByCompany(connections.data ?? []);
    const ids = rows.map((row) => row.company.id);
    if (companyId) return ids.filter((id) => id !== companyId);
    return ids;
  }, [connections.data, companyId]);

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

  const connectionName = (id: string) =>
    connections.data?.find((row) => row.company.id === id)?.company.name ?? null;

  const pickerConnections = useMemo(() => {
    const rows = connections.data ?? [];
    if (!companyId) return rows;
    return rows.filter((row) => row.company.id !== companyId);
  }, [connections.data, companyId]);

  const send = useMutation({
    mutationFn: async () => {
      const targets = dedupeCompanyIds(recipientIds);
      if (targets.length === 0) throw new Error('Pick at least one business');
      setError(null);
      const trimmed = note.trim();
      const threadIds: string[] = [];

      if (payload.kind === 'catalog') {
        const { albums, designs, total } = catalogItems(payload);
        if (total === 0) throw new Error('Nothing to share');
        for (const targetId of targets) {
          const thread = await api.post<StartDirectThreadResult>('/threads/direct', {
            companyId: targetId,
          });
          await postCatalogCardsToThread(thread.id, {
            collections: albums,
            products: designs,
            enquireNote: trimmed || undefined,
          });
          threadIds.push(thread.id);
        }
      } else {
        const url = companyProfileShareUrl(window.location.origin, payload.companyId);
        let body = companyProfileShareBody(payload.companyName, url);
        if (trimmed) body = `${body}\n\n${trimmed}`;
        for (const targetId of targets) {
          const thread = await api.post<StartDirectThreadResult>('/threads/direct', {
            companyId: targetId,
          });
          await api.post<MessageView>(`/threads/${thread.id}/messages`, {
            type: MessageType.Text,
            body,
          });
          threadIds.push(thread.id);
        }
      }

      return {
        threadIds,
        recipientCount: targets.length,
        singleName: targets.length === 1 ? connectionName(targets[0]!) : null,
      };
    },
    onSuccess: ({ threadIds, recipientCount, singleName }) => {
      showToast(catalogShareToastLabel({ recipientCount, singleName }));
      if (payload.kind === 'catalog') payload.onShared?.();
      onClose();
      if (shouldOpenChatAfterCatalogShare(recipientCount) && threadIds[0]) {
        navigate(`/chats/${threadIds[0]}`);
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not share.');
    },
  });

  const linkBodies =
    payload.kind === 'catalog'
      ? catalogShareLinkBodies({
          collectionIds: catalogItems(payload).albums.map((item) => item.collectionId),
          productIds: catalogItems(payload).designs.map((item) => item.productId),
        })
      : [];

  const canLink =
    payload.kind === 'company'
      ? Boolean(payload.companyId)
      : catalogShareCanLink({
          collectionIds: catalogItems(payload).albums.map((item) => item.collectionId),
          productIds: catalogItems(payload).designs.map((item) => item.productId),
        });

  const runNative = async () => {
    if (nativePending || send.isPending) return;
    setError(null);
    setReadyInvite(null);
    setNativePending(true);
    try {
      const trimmed = note.trim();

      if (payload.kind === 'company') {
        const url = companyProfileShareUrl(window.location.origin, payload.companyId);
        const copy = companyShareCopy(payload.companyName);
        const text = trimmed
          ? shareMessageText(`${copy.text}\n\n${trimmed}`, url)
          : shareMessageText(copy.text, url);
        try {
          const handoff = await shareOrCopyInvite({
            url,
            title: copy.title,
            text,
            preferShareSheet: true,
          });
          if (handoff === 'copied') showToast('Link copied');
          if (handoff !== 'manual') onClose();
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError('Could not share the profile.');
        }
        return;
      }

      if (linkBodies.length < 1) throw new Error('Nothing to share');
      const links: ShareLinkView[] = [];
      for (const body of linkBodies) {
        links.push(await api.post<ShareLinkView>('/share-links', body));
      }
      const first = links[0];
      if (!first) return;
      const origin = window.location.origin;
      const urls = links.map((link) => `${origin}${link.path}`);
      const copy = catalogShareCopy({
        name: first.name,
        kind: first.kind,
        companyName: first.companyName,
      });
      const lead = trimmed ? [trimmed, copy.text] : [copy.text];
      const text = catalogShareInviteText(lead, urls);
      try {
        const handoff = await shareOrCopyInvite({
          url: urls[0]!,
          title: copy.title,
          text,
          copyText: links.length > 1 ? text : undefined,
          preferShareSheet: canNativeShare(),
        });
        if (handoff === 'copied') showToast(catalogShareCopiedToast(links.length));
        if (handoff === 'manual') setReadyInvite(text);
        else onClose();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setReadyInvite(text);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not make a link.');
    } finally {
      setNativePending(false);
    }
  };

  const selectedCount = recipientIds.length;
  const busy = send.isPending || nativePending;
  const emptyCatalog = payload.kind === 'catalog' && (catalog?.total ?? 0) < 1;

  return (
    <>
      <Sheet
        open={open}
        onClose={() => {
          if (!send.isPending) onClose();
        }}
        title={sheetTitleFor(payload)}
        /** Hug content height; scroll only after the list hits the viewport cap. */
        panelClassName="max-h-[min(92dvh,100dvh)]"
        footer={
          emptyCatalog ? null : (
            <div className="-mx-1 rounded-xl bg-canvas px-1 py-1" data-testid="share-composer-band">
              <ShareComposerBar
                value={note}
                onChange={setNote}
                busy={busy}
                sendDisabled={selectedCount < 1}
                nativeDisabled={!canLink}
                showNative={canLink}
                onSend={() => send.mutate()}
                onNativeShare={() => void runNative()}
                sendTestId={payload.kind === 'company' ? 'company-share-send' : 'catalog-share-send'}
                nativeTestId={
                  payload.kind === 'company' ? 'company-share-outside' : 'catalog-share-link'
                }
              />
            </div>
          )
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
        {emptyCatalog ? (
          <p className="text-sm text-muted">Nothing to share.</p>
        ) : connections.isLoading ? (
          <LoadingBlock />
        ) : (
          <div className="flex flex-col gap-3" data-testid="share-recipient-scroll">
            {selectedCount > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted">{selectedCount} selected · posts into chat</p>
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
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5" data-testid="catalog-share-groups">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-ink">Buyer groups</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setCreateGroupOpen(true)}
                  className="text-xs font-medium text-accent disabled:opacity-50"
                  data-testid="share-create-group"
                >
                  Create group
                </button>
              </div>
              {shareableGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {shareableGroups.map((group) => {
                    const selected = selectedGroupIds.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        data-testid={`catalog-share-group-${group.id}`}
                        disabled={busy}
                        aria-pressed={selected}
                        onClick={() =>
                          setSelectedGroupIds((prev) =>
                            prev.includes(group.id)
                              ? prev.filter((id) => id !== group.id)
                              : [...prev, group.id],
                          )
                        }
                        className={cx(
                          'rounded-full border px-3 py-1 text-xs font-medium',
                          selected
                            ? 'border-accent bg-accent/5 text-ink'
                            : 'border-line text-ink',
                        )}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted">No groups yet — create one, or pick shops below.</p>
              )}
            </div>

            <ConnectionPicker
              mode="multi"
              embedded
              label=""
              connections={pickerConnections}
              value={selectedCompanyIds}
              onChange={setSelectedCompanyIds}
              emptyMessage="No connections yet — find a business below."
              findOnEkum="link"
              onMessageFound={(foundId) => {
                if (companyId && foundId === companyId) return;
                setSelectedCompanyIds((prev) => dedupeCompanyIds([...prev, foundId]));
              }}
            />
          </div>
        )}
      </Sheet>

      <BuyerGroupFormSheet
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSaved={(list) => {
          setSelectedGroupIds((prev) =>
            prev.includes(list.id) ? prev : [...prev, list.id],
          );
          void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
          setCreateGroupOpen(false);
        }}
      />
    </>
  );
}
