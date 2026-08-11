import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, Card, Field, LoadingBlock, TextArea, TextInput, cx } from '@/ui/kit';

type BroadcastKind = 'collection' | 'text';

export function BroadcastComposePage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<BroadcastKind | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [lists, setLists] = useState<Set<string>>(new Set());
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
  const hasAudience = recipients.length > 0 || lists.size > 0;
  const contentReady =
    kind === 'collection'
      ? Boolean(collectionId && subject.trim())
      : kind === 'text'
        ? Boolean(subject.trim() && body.trim())
        : false;
  const canSend = Boolean(kind && contentReady && hasAudience);

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
      <PageHeader title="Compose broadcast" />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">What to share</p>
        <div className="flex flex-col gap-1.5">
          {(
            [
              ['collection', 'Collection', 'Share a published album with buyers'],
              ['text', 'Coming soon / message', 'Announce something without a collection'],
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
              placeholder="Coming soon — wedding edit"
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
          {savedLists.data && savedLists.data.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">Saved lists</p>
              <div className="flex flex-wrap gap-2">
                {savedLists.data.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => toggleList(list.id)}
                    className={cx(
                      'rounded-full px-3 py-1.5 text-sm',
                      lists.has(list.id) ? 'bg-accent text-white' : 'bg-foam text-muted',
                    )}
                  >
                    {list.name} · {list.memberCount}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <ConnectionPicker
            mode="multi"
            label="Recipients"
            chooseLabel="Choose recipients"
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
        </>
      ) : null}
    </div>
  );
}
