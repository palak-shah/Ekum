import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccessRequestView,
  CollectionCard,
  CompanyContactPoint,
  ConnectionView,
  CursorPage,
  PublicCompanyProfile,
  PublicCompanySummary,
  ThreadSummary,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { CollectionTile } from '@/ui/cards';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  Field,
  LoadingBlock,
  SectionHeader,
  Sheet,
  StatusPill,
  Tag,
  TextArea,
} from '@/ui/kit';

export function CompanyProfilePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gateOpen, setGateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ['company', id],
    queryFn: () => api.get<PublicCompanyProfile>(`/companies/${id}`),
  });
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });
  const outgoing = useQuery({
    queryKey: ['access-requests', 'outgoing'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/outgoing'),
  });
  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<PublicCompanySummary[]>('/follows/following'),
  });
  const shop = useQuery({
    queryKey: ['company', id, 'collections'],
    queryFn: () =>
      api.get<CursorPage<CollectionCard>>(`/companies/${id}/collections`, { limit: 20 }),
    enabled: Boolean(id),
  });

  const connection = connections.data?.find((item) => item.company.id === id);
  const isConnected = connection?.status === 'active';
  const pendingRequest = outgoing.data?.find(
    (item) => item.company.id === id && item.status === 'pending',
  );
  const isFollowing = following.data?.some((item) => item.id === id) ?? false;

  const refreshAfterAccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    void queryClient.invalidateQueries({ queryKey: ['connections'] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
  };

  const toggleFollow = useMutation({
    mutationFn: () =>
      isFollowing ? api.del(`/follows/${id}`) : api.post('/follows', { companyId: id }),
    onSuccess: () => {
      setMoreOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['follows', 'following'] });
    },
  });

  const requestAccess = useMutation({
    mutationFn: () =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId: id,
        note: note || undefined,
      }),
    onSuccess: () => {
      setGateOpen(false);
      setNote('');
      setActionError(null);
      setSuccessNote('Request sent — they will see it in chat.');
      refreshAfterAccess();
    },
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not send request.'),
  });

  const startChat = useMutation({
    mutationFn: () => api.post<ThreadSummary>('/threads/direct', { companyId: id }),
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      navigate(`/chats/${thread.id}`);
    },
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not open chat.'),
  });

  if (profile.isLoading) {
    return <LoadingBlock label="Loading business…" />;
  }
  if (profile.isError || !profile.data) {
    return (
      <>
        <PageHeader title="Business" />
        <ErrorState message="This business isn't available." />
      </>
    );
  }

  const company = profile.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={company.name}
        subtitle={company.city}
        action={
          <button
            type="button"
            className="text-sm font-medium text-accent"
            onClick={() => setMoreOpen(true)}
          >
            More
          </button>
        }
      />

      <Card className="flex flex-col items-center gap-3 text-center">
        <Avatar name={company.name} size={64} />
        <div>
          <h2 className="text-lg font-semibold text-ink">{company.name}</h2>
          <p className="text-sm text-muted">{company.city}</p>
        </div>
        {company.verification === 'gst_verified' ? <Tag tone="success">GST verified</Tag> : null}
        {company.about ? <p className="text-sm text-muted">{company.about}</p> : null}
        {company.categories.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5">
            {company.categories.map((category) => (
              <Tag key={category}>{category}</Tag>
            ))}
          </div>
        ) : null}
      </Card>

      {isConnected ? (
        <ConnectedPanel
          companyId={id}
          onMessage={() => startChat.mutate()}
          messaging={startChat.isPending}
        />
      ) : pendingRequest ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">Waiting for them</p>
              <p className="text-xs text-muted">
                Access requested. {company.name} will see your note in chat.
              </p>
            </div>
            <StatusPill status="pending" />
          </div>
          <Button fullWidth onClick={() => startChat.mutate()} disabled={startChat.isPending}>
            {startChat.isPending ? 'Opening…' : 'Open chat'}
          </Button>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Ask to see rates and order</p>
            <p className="text-xs text-muted">
              Send a short request. They approve once — then you can message and place orders.
            </p>
          </div>
          <Button fullWidth onClick={() => setGateOpen(true)}>
            Request access
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => startChat.mutate()}
            disabled={startChat.isPending}
          >
            Message
          </Button>
        </Card>
      )}

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      {shop.isLoading ? (
        <LoadingBlock label="Loading collections…" />
      ) : shop.data && shop.data.results.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeader title="Shop" />
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {shop.data.results.map((collection) => (
              <CollectionTile key={collection.id} collection={collection} showCompany={false} />
            ))}
          </div>
        </section>
      ) : null}

      <Sheet open={gateOpen} onClose={() => setGateOpen(false)} title={`Request access · ${company.name}`}>
        <div className="flex flex-col gap-3">
          <Field
            label="Add a note"
            hint="Introduce your business and what you're looking for."
            error={actionError}
          >
            <TextArea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Hi, we run a retail store in Jaipur…"
            />
          </Field>
          <Button fullWidth onClick={() => requestAccess.mutate()} disabled={requestAccess.isPending}>
            {requestAccess.isPending ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => toggleFollow.mutate()}
            disabled={toggleFollow.isPending}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
          <p className="text-center text-xs text-muted">
            Follow keeps their new collections on your Home. It does not unlock rates.
          </p>
        </div>
      </Sheet>
    </div>
  );
}

function ConnectedPanel({
  companyId,
  onMessage,
  messaging,
}: {
  companyId: string;
  onMessage: () => void;
  messaging: boolean;
}) {
  const navigate = useNavigate();
  const contact = useQuery({
    queryKey: ['company', companyId, 'contact'],
    queryFn: () => api.get<CompanyContactPoint[]>(`/companies/${companyId}/contact`),
  });
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Tag tone="success">Connected</Tag>
        <span className="text-xs text-muted">You can see rates and place orders.</span>
      </div>
      {contact.data && contact.data.length > 0 ? (
        <div className="flex flex-col gap-1">
          {contact.data.map((point, index) => (
            <p key={index} className="text-sm text-ink">
              {point.name}
              {point.role ? <span className="text-muted"> · {point.role}</span> : null}
              {point.phone ? <span className="text-muted"> · {point.phone}</span> : null}
            </p>
          ))}
        </div>
      ) : null}
      <Button fullWidth onClick={onMessage} disabled={messaging}>
        {messaging ? 'Opening…' : 'Message'}
      </Button>
      <Button variant="secondary" fullWidth onClick={() => navigate(`/orders/new?seller=${companyId}`)}>
        Photo order
      </Button>
    </Card>
  );
}
