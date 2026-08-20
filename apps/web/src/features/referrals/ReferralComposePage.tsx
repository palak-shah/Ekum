import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ConnectionView, CreateReferralDto, ReferralView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { canNativeShare, inviteShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Button, Card, Field, LoadingBlock, TextArea } from '@/ui/kit';

export function ReferralComposePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
    const isOpen = !created.target;

    const share = async () => {
      const copy = inviteShareCopy({
        url,
        kind: isOpen ? 'connect' : 'vouch',
        targetName: created.target?.name,
      });
      try {
        const result = await shareOrCopyInvite({ url, ...copy });
        if (result === 'copied') showToast('Link copied');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        showToast('Could not share the link.', 'danger');
      }
    };

    return (
      <div className="flex flex-col gap-4">
        <PageHeader title={isOpen ? 'Invite ready' : 'Referral ready'} />
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-ink">
            {isOpen
              ? 'Share this link so partners can request to connect with you:'
              : 'Share this link:'}
          </p>
          <input readOnly value={url} className="rounded-lg bg-foam px-2 py-2 text-xs text-muted" />
          {canNativeShare() ? (
            <Button fullWidth onClick={() => void share()}>
              Share
            </Button>
          ) : null}
          <Button
            variant={canNativeShare() ? 'secondary' : 'primary'}
            fullWidth
            onClick={() => {
              void navigator.clipboard?.writeText(url).then(() => showToast('Link copied'));
            }}
          >
            Copy link
          </Button>
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
      <PageHeader title="New invite" />
      <Field
        label="Vouch for (optional)"
        hint="Leave blank for a connect-with-me invite. Pick a business to vouch for them instead."
      >
        <select
          value={targetCompanyId}
          onChange={(event) => setTargetCompanyId(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-accent"
        >
          <option value="">Connect with me</option>
          {activeConnections.map((connection) => (
            <option key={connection.company.id} value={connection.company.id}>
              {connection.company.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note" error={error}>
        <TextArea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            targetCompanyId ? 'Reliable supplier, great quality.' : 'Join my network on Ekum.'
          }
        />
      </Field>
      <Button fullWidth disabled={create.isPending} onClick={() => create.mutate()}>
        {create.isPending ? 'Creating…' : 'Create link'}
      </Button>
    </div>
  );
}
