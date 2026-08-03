import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CollectionDetailView,
  CreateCollectionDto,
  ProductView,
  PublishCollectionDto,
} from '@ekum/domain-types';
import { PublishAudience, RateVisibility } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, Field, LoadingBlock, Sheet, StatusPill, TextArea, TextInput, cx } from '@/ui/kit';

export function CollectionEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', coverImage: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [audience, setAudience] = useState<string>(PublishAudience.Connections);
  const [rateVisibility, setRateVisibility] = useState<string>(RateVisibility.OnRequest);
  const [consent, setConsent] = useState(false);

  const existing = useQuery({
    queryKey: ['collection', id],
    queryFn: () => api.get<CollectionDetailView>(`/collections/${id}`),
    enabled: editing,
  });
  const myProducts = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    enabled: editing,
  });

  const canPublishAlready = Boolean(company.data?.capabilities.publish);

  useEffect(() => {
    if (existing.data) {
      setForm({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
      });
      setSelected(new Set(existing.data.products.map((product) => product.id)));
      setAudience(existing.data.audience || PublishAudience.Connections);
      setRateVisibility(existing.data.rateVisibility || RateVisibility.OnRequest);
    }
  }, [existing.data]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['collection', id] });
    void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
    void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
  };

  const save = useMutation({
    mutationFn: () => {
      const dto: CreateCollectionDto = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
      };
      return editing
        ? api.patch<CollectionDetailView>(`/collections/${id}`, dto)
        : api.post<CollectionDetailView>('/collections', dto);
    },
    onSuccess: (collection) => {
      invalidate();
      if (!editing) {
        navigate(`/catalog/collections/${collection.id}`, { replace: true });
      }
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save.'),
  });

  const saveProducts = useMutation({
    mutationFn: () => api.put(`/collections/${id}/products`, { productIds: [...selected] }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update designs.'),
  });

  const publish = useMutation({
    mutationFn: () => {
      const dto: PublishCollectionDto = {
        audience: audience as PublishCollectionDto['audience'],
        rateVisibility: rateVisibility as PublishCollectionDto['rateVisibility'],
        ...(canPublishAlready ? {} : { consentToSell: true }),
      };
      return api.post(`/collections/${id}/publish`, dto);
    },
    onSuccess: () => {
      setPublishOpen(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not publish.'),
  });

  const lifecycle = useMutation({
    mutationFn: (action: 'unpublish' | 'archive') => api.post(`/collections/${id}/${action}`, {}),
    onSuccess: () => {
      setPublishOpen(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update status.'),
  });

  if (editing && existing.isLoading) {
    return <LoadingBlock label="Loading collection…" />;
  }

  const toggle = (productId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

  const canSubmitPublish = canPublishAlready || consent;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={editing ? 'Edit collection' : 'New collection'}
        action={
          editing && existing.data ? (
            <button className="text-sm font-medium text-accent" onClick={() => setPublishOpen(true)}>
              Publish
            </button>
          ) : undefined
        }
      />

      {editing && existing.data ? <StatusPill status={existing.data.status} /> : null}

      <Field label="Name">
        <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Festive 2026" />
      </Field>
      <Field label="Cover image URL" hint="Optional.">
        <TextInput value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Description" error={error}>
        <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Button fullWidth disabled={!form.name.trim() || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? 'Saving…' : editing ? 'Save details' : 'Create collection'}
      </Button>

      {editing ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Designs in this collection</p>
            <span className="text-xs text-muted">{selected.size} selected</span>
          </div>
          {myProducts.data && myProducts.data.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {myProducts.data.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggle(product.id)}
                  className={cx(
                    'flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm',
                    selected.has(product.id) ? 'border-accent bg-accent/5 text-ink' : 'border-line text-muted',
                  )}
                >
                  <span className="truncate">{product.name}</span>
                  <span className="text-xs">{selected.has(product.id) ? 'Added' : 'Add'}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Upload designs first, then group them here.</p>
          )}
          <Button variant="secondary" fullWidth disabled={saveProducts.isPending} onClick={() => saveProducts.mutate()}>
            {saveProducts.isPending ? 'Saving…' : 'Save designs'}
          </Button>
        </Card>
      ) : null}

      <Sheet open={publishOpen} onClose={() => setPublishOpen(false)} title="Publish collection">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Who can see this?</p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  [PublishAudience.Everyone, 'Everyone'],
                  [PublishAudience.Connections, 'My connections'],
                  [PublishAudience.Selected, 'Selected (pick later)'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAudience(value)}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm',
                    audience === value ? 'border-accent bg-accent/5 font-medium text-ink' : 'border-line text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Show rates?</p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  [RateVisibility.OnRequest, 'On request'],
                  [RateVisibility.Visible, 'Visible'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRateVisibility(value)}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm',
                    rateVisibility === value
                      ? 'border-accent bg-accent/5 font-medium text-ink'
                      : 'border-line text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!canPublishAlready ? (
            <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>Your catalogue goes live — start selling?</span>
            </label>
          ) : null}

          {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

          <Button
            fullWidth
            disabled={!canSubmitPublish || publish.isPending}
            onClick={() => publish.mutate()}
          >
            {publish.isPending ? 'Publishing…' : 'Publish'}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => lifecycle.mutate('unpublish')}
            disabled={lifecycle.isPending}
          >
            Move to draft
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => lifecycle.mutate('archive')}
            disabled={lifecycle.isPending}
          >
            Archive
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
