import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CollectionDetailView,
  ConnectionView,
  CreateCollectionDto,
  CreateProductDto,
  ProductView,
  PublishCollectionDto,
} from '@ekum/domain-types';
import { ProductStatus, PublishAudience, RateVisibility } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { PageHeader } from '@/ui/PageHeader';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, Card, Field, LoadingBlock, Sheet, StatusPill, TextArea, TextInput, cx } from '@/ui/kit';
import { CameraIcon, PlusIcon } from '@/ui/icons';

const QUICK_PHOTO_CAP = 24;

function nameFromFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || 'Design';
}

export function CollectionEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const coverFileRef = useRef<HTMLInputElement>(null);
  const designFileRef = useRef<HTMLInputElement>(null);
  const phone = isPhoneLike();
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [designPickerOpen, setDesignPickerOpen] = useState(false);
  const [showCoverUrl, setShowCoverUrl] = useState(false);
  const [coverCapture, setCoverCapture] = useState<boolean | 'gallery'>(false);
  const [designCapture, setDesignCapture] = useState<boolean | 'gallery'>(false);
  const [uploading, setUploading] = useState(false);
  const [quickUploading, setQuickUploading] = useState(false);
  const [savingDesigns, setSavingDesigns] = useState(false);
  const [designSearch, setDesignSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', coverImage: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [audience, setAudience] = useState<string>(PublishAudience.Connections);
  const [audienceCompanies, setAudienceCompanies] = useState<Set<string>>(new Set());
  const [rateVisibility, setRateVisibility] = useState<string>(RateVisibility.OnRequest);
  const [consent, setConsent] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: publishOpen,
  });

  const canPublishAlready = Boolean(company.data?.capabilities.publish);
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');
  const isPublished = existing.data?.status === 'published';

  const selectableDesigns = (myProducts.data ?? []).filter(
    (product) => product.status !== ProductStatus.Archived,
  );
  const designQuery = designSearch.trim().toLowerCase();
  const filteredDesigns = designQuery
    ? selectableDesigns.filter((p) => p.name.toLowerCase().includes(designQuery))
    : selectableDesigns;
  const selectedProducts = selectableDesigns.filter((p) => selected.has(p.id));
  const canPublishAlbum = selected.size >= 1;

  useEffect(() => {
    if (existing.data) {
      setForm({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
      });
      setSelected(new Set(existing.data.products.map((product) => product.id)));
      setAudience(existing.data.audience || PublishAudience.Connections);
      setAudienceCompanies(new Set(existing.data.audienceCompanyIds ?? []));
      setRateVisibility(existing.data.rateVisibility || RateVisibility.OnRequest);
    }
  }, [existing.data]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['collection', id] });
    void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
    void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['explore'] });
  };

  const persistDesigns = async (productIds: string[]) => {
    if (!id) return;
    setSavingDesigns(true);
    setError(null);
    try {
      await api.put(`/collections/${id}/products`, { productIds });
      invalidate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update designs.');
    } finally {
      setSavingDesigns(false);
    }
  };

  const scheduleDesignSave = (next: Set<string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDesigns([...next]);
    }, 350);
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

  const publish = useMutation({
    mutationFn: () => {
      const dto: PublishCollectionDto = {
        audience: audience as PublishCollectionDto['audience'],
        rateVisibility: rateVisibility as PublishCollectionDto['rateVisibility'],
        ...(audience === PublishAudience.Selected
          ? { companyIds: [...audienceCompanies] }
          : {}),
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

  const openCoverPicker = () => {
    if (phone) {
      setCoverPickerOpen(true);
      return;
    }
    setCoverCapture('gallery');
    queueMicrotask(() => coverFileRef.current?.click());
  };

  const pickCover = (mode: 'camera' | 'gallery') => {
    setCoverPickerOpen(false);
    setCoverCapture(mode === 'camera' ? true : 'gallery');
    queueMicrotask(() => coverFileRef.current?.click());
  };

  const openDesignPicker = () => {
    if (phone) {
      setDesignPickerOpen(true);
      return;
    }
    setDesignCapture('gallery');
    queueMicrotask(() => designFileRef.current?.click());
  };

  const pickDesignPhotos = (mode: 'camera' | 'gallery') => {
    setDesignPickerOpen(false);
    setDesignCapture(mode === 'camera' ? true : 'gallery');
    queueMicrotask(() => designFileRef.current?.click());
  };

  const onCoverFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, coverImage: url }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    } finally {
      setUploading(false);
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  };

  const onQuickDesignFiles = async (fileList: FileList | null) => {
    if (!id || !fileList?.length) return;
    const room = QUICK_PHOTO_CAP;
    const files = [...fileList].slice(0, room);
    setError(null);
    setQuickUploading(true);
    try {
      const createdIds: string[] = [];
      for (const file of files) {
        const imageUrl = await uploadImage(file);
        const dto: CreateProductDto = {
          name: nameFromFilename(file.name),
          images: [imageUrl],
          categories: [],
        };
        const product = await api.post<ProductView>('/products', dto);
        createdIds.push(product.id);
      }
      const next = new Set(selected);
      for (const productId of createdIds) next.add(productId);
      setSelected(next);
      await persistDesigns([...next]);
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add photos.');
    } finally {
      setQuickUploading(false);
      if (designFileRef.current) designFileRef.current.value = '';
    }
  };

  if (editing && existing.isLoading) {
    return <LoadingBlock label="Loading collection…" />;
  }

  const toggle = (productId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      scheduleDesignSave(next);
      return next;
    });
  };

  const canSubmitPublish =
    (canPublishAlready || consent) &&
    (audience !== PublishAudience.Selected || audienceCompanies.size > 0) &&
    canPublishAlbum;

  return (
    <div className={cx('flex flex-col gap-4', editing ? 'pb-28' : 'pb-8')}>
      <PageHeader
        title={editing ? 'Edit collection' : 'New collection'}
        action={
          editing && existing.data ? <StatusPill status={existing.data.status} /> : undefined
        }
      />

      <div>
        <p className="mb-2 text-base font-medium text-ink">Cover photo</p>
        {form.coverImage ? (
          <div className="relative overflow-hidden rounded-2xl bg-foam">
            <img src={form.coverImage} alt="" className="h-40 w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-ink/50 p-2">
              <button
                type="button"
                onClick={openCoverPicker}
                disabled={uploading}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-ink"
              >
                {uploading ? 'Uploading…' : 'Change'}
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-ink"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openCoverPicker}
            disabled={uploading}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam text-muted"
          >
            <CameraIcon width={28} height={28} />
            <span className="text-sm font-medium text-ink">
              {uploading ? 'Uploading…' : 'Add cover · camera or gallery'}
            </span>
          </button>
        )}
        <button
          type="button"
          className="mt-2 text-xs text-muted underline"
          onClick={() => setShowCoverUrl((v) => !v)}
        >
          {showCoverUrl ? 'Hide link' : 'Paste image link instead'}
        </button>
        {showCoverUrl ? (
          <div className="mt-2">
            <TextInput
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              placeholder="https://…"
            />
          </div>
        ) : null}
      </div>

      <Field label="Name">
        <TextInput
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Festive 2026"
        />
      </Field>
      <Field label="Description" error={error}>
        <TextArea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>

      {!editing ? (
        <Button
          fullWidth
          disabled={!form.name.trim() || save.isPending || uploading}
          onClick={() => save.mutate()}
        >
          {save.isPending ? 'Saving…' : 'Create collection'}
        </Button>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-ink">
              {selectedProducts.length} design{selectedProducts.length === 1 ? '' : 's'} in collection
            </p>
            <span className="text-sm text-muted">
              {savingDesigns || quickUploading
                ? quickUploading
                  ? 'Adding…'
                  : 'Saving…'
                : null}
            </span>
          </div>

          {selectedProducts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selectedProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggle(product.id)}
                  className="relative overflow-hidden rounded-xl border-2 border-accent bg-foam"
                  aria-label={`Remove ${product.name}`}
                >
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-lg font-bold text-muted">
                      {product.name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                    ✓
                  </span>
                  {product.status === ProductStatus.Draft ? (
                    <span className="absolute left-1 top-1 rounded bg-ink/70 px-1.5 text-[10px] font-bold text-white">
                      Draft
                    </span>
                  ) : null}
                  <span className="block truncate bg-surface/95 px-1.5 py-1 text-sm text-ink">
                    {product.name}
                  </span>
                </button>
              ))}
            </div>
          ) : selectableDesigns.length > 0 ? (
            <p className="text-base text-muted">Tap designs below to add.</p>
          ) : null}

          <button
            type="button"
            onClick={openDesignPicker}
            disabled={quickUploading}
            className={cx(
              'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-base font-medium text-muted',
              'disabled:opacity-40',
            )}
          >
            <PlusIcon width={20} height={20} />
            {quickUploading ? 'Adding photos…' : 'Add photos as designs'}
          </button>
          <p className="text-center text-sm text-muted">
            Creates draft designs in your library and adds them here.
          </p>

          {selectableDesigns.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-base font-semibold text-ink">Your designs</p>
              <TextInput
                value={designSearch}
                onChange={(e) => setDesignSearch(e.target.value)}
                placeholder="Search by name"
              />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {filteredDesigns.map((product) => {
                  const on = selected.has(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggle(product.id)}
                      className={cx(
                        'relative overflow-hidden rounded-xl border-2 bg-foam text-left',
                        on ? 'border-accent' : 'border-transparent',
                      )}
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-lg font-bold text-muted">
                          {product.name.charAt(0)}
                        </div>
                      )}
                      {on ? (
                        <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                          ✓
                        </span>
                      ) : null}
                      {product.status === ProductStatus.Draft ? (
                        <span className="absolute left-1 top-1 rounded bg-ink/70 px-1.5 text-[10px] font-bold text-white">
                          Draft
                        </span>
                      ) : null}
                      <span className="block truncate px-1.5 py-1 text-sm text-ink">
                        {product.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {filteredDesigns.length === 0 ? (
                <p className="text-center text-sm text-muted">No designs match that name.</p>
              ) : null}
            </div>
          ) : (
            <Card className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-base font-medium text-ink">No designs yet</p>
              <p className="text-sm text-muted">
                Add photos above, or create designs in your library first.
              </p>
              <Button fullWidth onClick={() => navigate('/catalog/products/new')}>
                Add designs
              </Button>
            </Card>
          )}

          {isPublished ? (
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => lifecycle.mutate('unpublish')}
                disabled={lifecycle.isPending}
              >
                Hide from Explore
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => lifecycle.mutate('archive')}
                disabled={lifecycle.isPending}
              >
                Archive
              </Button>
              <p className="text-center text-sm text-muted">
                Hide keeps the album as a draft so you can edit quietly. Archive ends the season.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {editing && existing.data ? (
        <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-md gap-2">
            <Button
              variant="secondary"
              className="min-w-0 flex-1"
              disabled={!form.name.trim() || save.isPending || uploading}
              onClick={() => save.mutate()}
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
            {isPublished ? (
              <Button
                className="min-w-0 flex-1"
                variant="secondary"
                onClick={() => setPublishOpen(true)}
              >
                Visibility
              </Button>
            ) : (
              <Button
                className="min-w-0 flex-1"
                disabled={!canPublishAlbum}
                onClick={() => setPublishOpen(true)}
              >
                Publish
              </Button>
            )}
          </div>
          {!isPublished && !canPublishAlbum ? (
            <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted">
              Add at least one design to publish.
            </p>
          ) : null}
        </div>
      ) : null}

      <input
        ref={coverFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture={coverCapture === true ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => void onCoverFile(e.target.files)}
      />
      <input
        ref={designFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple={designCapture !== true}
        capture={designCapture === true ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => void onQuickDesignFiles(e.target.files)}
      />

      <Sheet open={coverPickerOpen} onClose={() => setCoverPickerOpen(false)} title="Cover photo">
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => pickCover('camera')}>
            Camera
          </Button>
          <Button variant="secondary" fullWidth onClick={() => pickCover('gallery')}>
            Gallery
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={designPickerOpen}
        onClose={() => setDesignPickerOpen(false)}
        title="Add photos as designs"
      >
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-sm text-muted">
            Each photo becomes a draft design in your library and joins this collection.
          </p>
          <Button fullWidth onClick={() => pickDesignPhotos('camera')}>
            Camera
          </Button>
          <Button variant="secondary" fullWidth onClick={() => pickDesignPhotos('gallery')}>
            Gallery
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title={isPublished ? 'Visibility & rates' : 'Publish collection'}
      >
        <div className="flex flex-col gap-4">
          {!isPublished ? (
            <p className="text-sm text-muted">
              Draft designs in this album will be published with the collection. Explore posting for
              single designs stays separate.
            </p>
          ) : null}
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Who can see this?</p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  [PublishAudience.Everyone, 'Everyone'],
                  [PublishAudience.Connections, 'My connections'],
                  [PublishAudience.Selected, 'Selected companies'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAudience(value)}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm',
                    audience === value
                      ? 'border-accent bg-accent/5 font-medium text-ink'
                      : 'border-line text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {audience === PublishAudience.Selected ? (
              <div className="mt-3">
                <p className="mb-2 text-xs text-muted">
                  {audienceCompanies.size} selected · only these businesses will see it
                </p>
                <ConnectionPicker
                  mode="multi"
                  embedded
                  label=""
                  loading={connections.isLoading}
                  connections={activeConnections}
                  value={[...audienceCompanies]}
                  onChange={(ids) => setAudienceCompanies(new Set(ids))}
                  emptyMessage="Approve a connection first, then pick them here."
                />
              </div>
            ) : null}
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
              <span>Start selling — publish this collection?</span>
            </label>
          ) : null}

          {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

          <Button
            fullWidth
            disabled={!canSubmitPublish || publish.isPending}
            onClick={() => publish.mutate()}
          >
            {publish.isPending ? 'Publishing…' : isPublished ? 'Update visibility' : 'Publish'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
