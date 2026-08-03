import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { BroadcastListView, BroadcastView, ConnectionView, SendBroadcastDto } from '@ekum/domain-types';
import { MessageType } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, Field, LoadingBlock, TextArea, TextInput, cx } from '@/ui/kit';

export function BroadcastComposePage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<Set<string>>(new Set());
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

  const send = useMutation({
    mutationFn: () => {
      const dto: SendBroadcastDto = {
        type: MessageType.Text,
        subject: subject.trim(),
        body: body.trim() || undefined,
        recipientCompanyIds: [...recipients],
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
          <p className="text-sm text-ink">Delivered to {sent} business{sent === 1 ? '' : 'es'}.</p>
        </Card>
        <Button onClick={() => navigate('/broadcast')}>Done</Button>
      </div>
    );
  }

  const toggle = (set: Set<string>, setter: (next: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setter(next);
  };

  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');
  const canSend = subject.trim() && (recipients.size > 0 || lists.size > 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Compose broadcast" />

      <Field label="Subject">
        <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New festive collection is live" />
      </Field>
      <Field label="Message" error={error}>
        <TextArea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share what's new…" />
      </Field>

      {savedLists.data && savedLists.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">Saved lists</p>
          <div className="flex flex-wrap gap-2">
            {savedLists.data.map((list) => (
              <button
                key={list.id}
                onClick={() => toggle(lists, setLists, list.id)}
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

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">Recipients</p>
        {activeConnections.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {activeConnections.map((connection) => (
              <button
                key={connection.company.id}
                onClick={() => toggle(recipients, setRecipients, connection.company.id)}
                className={cx(
                  'flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm',
                  recipients.has(connection.company.id)
                    ? 'border-accent bg-accent/5 text-ink'
                    : 'border-line text-muted',
                )}
              >
                <span className="truncate">{connection.company.name}</span>
                <span className="text-xs">{recipients.has(connection.company.id) ? 'Selected' : 'Add'}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Connect with buyers to broadcast to them.</p>
        )}
      </div>

      <Button fullWidth disabled={!canSend || send.isPending} onClick={() => send.mutate()}>
        {send.isPending ? 'Sending…' : 'Send broadcast'}
      </Button>
    </div>
  );
}
