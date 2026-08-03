import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ConnectionView, CreateReferralDto, ReferralView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, Field, LoadingBlock, TextArea } from '@/ui/kit';

export function ReferralComposePage() {
  const navigate = useNavigate();
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ReferralView | null>(null);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });

  const create = useMutation({
    mutationFn: () => {
      const dto: CreateReferralDto = {
        targetCompanyId: targetCompanyId || undefined,
        note: note.trim() || undefined,
      };
      return api.post<ReferralView>('/referrals', dto);
    },
    onSuccess: (referral) => setCreated(referral),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not create the link.'),
  });

  if (connections.isLoading) {
    return <LoadingBlock />;
  }

  if (created) {
    const url = `${window.location.origin}/r/${created.token}`;
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Referral ready" />
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-ink">Share this link:</p>
          <input readOnly value={url} className="rounded-lg bg-foam px-2 py-2 text-xs text-muted" />
          <Button onClick={() => void navigator.clipboard?.writeText(url)}>Copy link</Button>
        </Card>
        <Button variant="secondary" onClick={() => navigate('/referrals')}>
          Done
        </Button>
      </div>
    );
  }

  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="New referral" />
      <Field label="Vouch for (optional)" hint="Leave blank for an open invite.">
        <select
          value={targetCompanyId}
          onChange={(event) => setTargetCompanyId(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-accent"
        >
          <option value="">Open invite</option>
          {activeConnections.map((connection) => (
            <option key={connection.company.id} value={connection.company.id}>
              {connection.company.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note" error={error}>
        <TextArea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Reliable supplier, great quality." />
      </Field>
      <Button fullWidth disabled={create.isPending} onClick={() => create.mutate()}>
        {create.isPending ? 'Creating…' : 'Create link'}
      </Button>
    </div>
  );
}
