import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BroadcastListView,
  BroadcastView,
  CollectionView,
  ConnectionView,
  SendBroadcastDto,
} from '@ekum/domain-types';
import { CollectionStatus, MessageType } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, Card, Field, LoadingBlock, TextArea, TextInput, cx } from '@/ui/kit';
import { BuyerGroupFormSheet } from './BuyerGroupFormSheet';

type BroadcastKind = 'collection' | 'text';

export function BroadcastComposePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const preselectedCollectionId = params.get('collectionId');
  const [kind, setKind] = useState<BroadcastKind | null>(
    preselectedCollectionId ? 'collection' : null,
  );
  const [collectionId, setCollectionId] = useState<string | null>(preselectedCollectionId);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [lists, setLists] = useState<Set<string>>(new Set());
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });
  const savedLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
  });
  const collections = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: kind === 'collection',
  });

  const publishedCollections = (collections.data ?? []).filter(
    (c) => c.status === CollectionStatus.Published,
  );

  useEffect(() => {
    if (!preselectedCollectionId || !collections.data) return;
    const match = collections.data.find((c) => c.id === preselectedCollectionId);
    if (match) {
      setKind('collection');
      setCollectionId(match.id);
      setSubject((prev) => prev || match.name);
    }
  }, [preselectedCollectionId, collections.data]);

  const send = useMutation({
    mutationFn: () => {
      const dto: SendBroadcastDto =
        kind === 'collection' && collectionId
          ? {
              type: MessageType.CollectionCard,
              subject: subject.trim(),
              body: body.trim() || undefined,
              referenceId: collectionId,
              recipientCompanyIds: recipients,
              listIds: [...lists],
            }
          : {
              type: MessageType.Text,
              subject: subject.trim(),
              body: body.trim() || undefined,
              recipientCompanyIds: recipients,
              listIds: [...lists],
            };
      return api.post<BroadcastView>('/broadcasts', dto);
    },
    onSuccess: (result) => setSent(result.recipientCount),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send broadcast.'),
  });

  if (connections.isLoading) {
    return <LoadingBlock />;
  }

  if (sent !== null) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Broadcast sent" />
        <Card className="text-center">
          <p className="text-sm text-ink">
            Delivered to {sent} business{sent === 1 ? '' : 'es'}.
          </p>
        </Card>
        <Button onClick={() => navigate('/broadcast')}>Done</Button>
      </div>
    );
  }

  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');
  const buyerGroups = savedLists.data ?? [];
  const selectedGroups = buyerGroups.filter((list) => lists.has(list.id));
  const groupMemberCount = new Set(selectedGroups.flatMap((list) => list.memberCompanyIds)).size;
  const hasAudience = recipients.length > 0 || lists.size > 0;
  const contentReady =
    kind === 'collection'
      ? Boolean(collectionId && subject.trim())
      : kind === 'text'
        ? Boolean(subject.trim() && body.trim())
        : false;
  const canSend = Boolean(kind && contentReady && hasAudience);

  const broadcastDirty = useMemo(
    () =>
      Boolean(
        kind ||
          subject.trim() ||
          body.trim() ||
          recipients.length > 0 ||
          lists.size > 0 ||
          collectionId,
      ),
    [kind, subject, body, recipients.length, lists.size, collectionId],
  );
  const discard = useDiscardGuard(broadcastDirty);

  const toggleList = (id: string) => {
    setLists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <PageHeader
        title="Compose broadcast"
        onBack={() => discard.tryLeave(() => navigate('/broadcast'))}
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">What to share</p>
        <div className="flex flex-col gap-1.5">
          {(
            [
              ['collection', 'Collection', 'Share a published album with buyers'],
              ['text', 'Text message', 'Announce something without a collection'],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setKind(value);
                setError(null);
                if (value === 'text') setCollectionId(null);
              }}
              className={cx(
                'rounded-xl border px-3 py-2.5 text-left',
                kind === value
                  ? 'border-accent bg-accent/5'
                  : 'border-line bg-surface',
              )}
            >
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-muted">{hint}</p>
            </button>
          ))}
        </div>
      </div>

      {kind === 'collection' ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">Collection</p>
          {collections.isLoading ? (
            <LoadingBlock label="Loading collections…" />
          ) : publishedCollections.length === 0 ? (
            <p className="text-sm text-muted">
              Publish a collection first, then share it here.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {publishedCollections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => {
                    setCollectionId(collection.id);
                    setSubject(collection.name);
                  }}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm',
                    collectionId === collection.id
                      ? 'border-accent bg-accent/5 font-medium text-ink'
                      : 'border-line text-muted',
                  )}
                >
                  {collection.name}
                  <span className="ml-2 text-xs font-normal text-muted">
                    {collection.productCount} design{collection.productCount === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            </div>
          )}
          <Field label="Subject">
            <TextInput
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="New festive collection is live"
            />
          </Field>
          <Field label="Note" hint="Optional.">
            <TextArea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Highlight what is new…"
            />
          </Field>
        </div>
      ) : null}

      {kind === 'text' ? (
        <>
          <Field label="Subject">
            <TextInput
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Wedding edit is live"
            />
          </Field>
          <Field label="Message" error={error}>
            <TextArea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share what is new…"
            />
          </Field>
        </>
      ) : null}

      {kind ? (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">Buyer groups</p>
              <button
                type="button"
                className="text-xs font-medium text-accent"
                onClick={() => setGroupSheetOpen(true)}
              >
                {buyerGroups.length > 0 ? 'Add group' : 'Create group'}
              </button>
            </div>
            {savedLists.isLoading ? (
              <LoadingBlock label="Loading groups…" />
            ) : buyerGroups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {buyerGroups.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => toggleList(list.id)}
                    className={cx(
                      'rounded-full border px-3 py-1.5 text-sm',
                      lists.has(list.id)
                        ? 'border-accent bg-accent/5 font-medium text-ink'
                        : 'border-line bg-foam text-muted',
                    )}
                  >
                    {list.name} · {list.memberCount}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">Reuse the same buyers next time</p>
            )}
            {lists.size > 0 ? (
              <p className="text-xs text-muted">
                {groupMemberCount} business{groupMemberCount === 1 ? '' : 'es'} in selected groups
                {selectedGroups.length > 1 ? ` · ${selectedGroups.length} groups` : ''}
              </p>
            ) : null}
          </div>

          <ConnectionPicker
            mode="multi"
            label={lists.size > 0 ? 'Or add companies' : 'Recipients'}
            chooseLabel={lists.size > 0 ? 'Add companies' : 'Choose recipients'}
            connections={activeConnections}
            value={recipients}
            onChange={setRecipients}
            emptyMessage="Connect with buyers to broadcast to them."
          />

          {error && kind === 'collection' ? (
            <p className="text-center text-xs text-danger">{error}</p>
          ) : null}

          <div className="border-t border-line pt-4">
            <Button fullWidth disabled={!canSend || send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? 'Sending…' : 'Send broadcast'}
            </Button>
          </div>

          <BuyerGroupFormSheet
            open={groupSheetOpen}
            onClose={() => setGroupSheetOpen(false)}
            onSaved={(list) => {
              void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
              setLists((prev) => new Set(prev).add(list.id));
            }}
          />
        </>
      ) : null}
    </div>
  );
}
