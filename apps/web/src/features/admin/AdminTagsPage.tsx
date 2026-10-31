import { useDeferredValue, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  masterOptionKindValues,
  type MasterCategoryView,
  type MasterOptionKind as OptionKind,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import { Button, Field, InlineNotice, LoadingBlock, TextInput } from '@/ui/kit';
import { SELECT_FIELD_CLASS } from '@/ui/fieldFill';
import { AdminBulkPastePanel } from './AdminAddTagsPanel';
import { AdminTagList } from './AdminTagList';
import {
  ADMIN_TAG_PAGE_SIZE,
  KIND_LABEL,
  recomputeBulkPreview,
  type AdminTagListPage,
  type BulkCommitResult,
  type BulkPreview,
} from './adminTagKinds';

export function AdminTagsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q);
  const [categoryId, setCategoryId] = useState('');
  const [kind, setKind] = useState<OptionKind | ''>('');
  const [bulkText, setBulkText] = useState('');
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  /** Labels known to exist in this category/kind (from preview + loaded list). */
  const [knownExisting, setKnownExisting] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const scopesReady = Boolean(categoryId && kind);

  const categories = useQuery({
    queryKey: ['admin-master-categories'],
    queryFn: () => api.get<MasterCategoryView[]>('/admin/master-categories'),
  });

  const tagsQuery = useInfiniteQuery({
    queryKey: ['admin-tags', deferredQ, categoryId, kind],
    enabled: scopesReady,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (deferredQ.trim()) params.set('q', deferredQ.trim());
      params.set('categoryId', categoryId);
      params.set('kind', kind);
      params.set('includeInactive', 'true');
      params.set('take', String(ADMIN_TAG_PAGE_SIZE));
      params.set('skip', String(pageParam));
      return api.get<AdminTagListPage>(`/admin/tags?${params.toString()}`);
    },
    getNextPageParam: (last) => {
      const next = last.skip + last.items.length;
      return next < last.total ? next : undefined;
    },
  });

  const tags = useMemo(
    () => tagsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [tagsQuery.data],
  );
  const total = tagsQuery.data?.pages[0]?.total ?? 0;

  const existingLower = useMemo(() => {
    const set = new Set(knownExisting);
    for (const t of tags) set.add(t.label.trim().toLowerCase());
    return set;
  }, [knownExisting, tags]);

  const exactMatch = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return null;
    return tags.find((t) => t.label.toLowerCase() === needle) ?? null;
  }, [tags, q]);

  const canAdd =
    scopesReady && Boolean(q.trim()) && !exactMatch && !tagsQuery.isFetching;

  const createTag = useMutation({
    mutationFn: () =>
      api.post('/admin/tags', {
        categoryId,
        kind,
        label: q.trim(),
      }),
    onSuccess: () => {
      setQ('');
      setError(null);
      showToast('Tag added.');
      void queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not add tag.'),
  });

  const archiveTag = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tags/${id}/archive`, {}),
    onSuccess: () => {
      showToast('Tag archived.');
      void queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not archive.'),
  });

  const restoreTag = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tags/${id}/restore`, {}),
    onSuccess: () => {
      setError(null);
      showToast('Tag restored.');
      void queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not restore.'),
  });

  const deleteTag = useMutation({
    mutationFn: (id: string) => api.del(`/admin/tags/${id}`),
    onSuccess: () => {
      showToast('Tag deleted.');
      void queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not delete.'),
  });

  const updateTag = useMutation({
    mutationFn: (payload: { id: string; label: string }) =>
      api.patch(`/admin/tags/${payload.id}`, { label: payload.label }),
    onSuccess: () => {
      showToast('Tag updated.');
      void queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
  });

  const runPreview = useMutation({
    mutationFn: (text: string) =>
      api.post<BulkPreview>('/admin/tags/bulk/preview', {
        categoryId,
        kind,
        text,
      }),
    onSuccess: (data) => {
      setPreview(data);
      setKnownExisting((prev) => {
        const next = new Set(prev);
        for (const row of data.rows) {
          if (row.status === 'existing') {
            next.add(row.label.trim().toLowerCase());
          }
        }
        return next;
      });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not preview.'),
  });

  const runCommit = useMutation({
    mutationFn: (payload: {
      categoryId: string;
      kind: OptionKind;
      labels: string[];
    }) => api.post<BulkCommitResult>('/admin/tags/bulk/commit', payload),
    onSuccess: (result) => {
      showToast(
        `Created ${result.created}. Skipped ${result.skippedDuplicates}. Invalid ${result.invalid}. Failed ${result.failed}.`,
      );
      setBulkText('');
      setPreview(null);
      setKnownExisting(new Set());
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not save bulk tags.'),
  });

  const categoryLabel = useMemo(() => {
    const row = categories.data?.find((c) => c.id === categoryId);
    return row?.label ?? '';
  }, [categories.data, categoryId]);

  const clearPreviewOnFilter = () => {
    setPreview(null);
    setKnownExisting(new Set());
    setQ('');
  };

  return (
    <div className="flex flex-col gap-3" data-testid="admin-tags-page">
      <h2 className="text-base font-emphasis text-ink">Tag Management</h2>

      {error ? <InlineNotice tone="danger" message={error} /> : null}

      <Field label="Master category">
        <select
          className={`h-12 w-full ${SELECT_FIELD_CLASS} px-3 text-[16px] text-ink`}
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            clearPreviewOnFilter();
          }}
          data-testid="admin-filter-category"
        >
          <option value="">Pick category…</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Option type">
        <select
          className={`h-12 w-full ${SELECT_FIELD_CLASS} px-3 text-[16px] text-ink`}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as OptionKind | '');
            clearPreviewOnFilter();
          }}
          data-testid="admin-filter-kind"
        >
          <option value="">Pick type…</option>
          {masterOptionKindValues.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>

      {!scopesReady ? (
        <p className="text-sm text-muted" data-testid="admin-tags-pick-scope">
          Pick a master category and option type to search, add, or browse tags.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Field label="Search or add">
              <div className="flex gap-2">
                <TextInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Type to find… or add a new name"
                  data-testid="admin-search-add"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canAdd && !createTag.isPending) {
                      e.preventDefault();
                      createTag.mutate();
                    }
                  }}
                />
                <Button
                  disabled={!canAdd || createTag.isPending}
                  onClick={() => createTag.mutate()}
                  data-testid="admin-search-add-submit"
                >
                  Add
                </Button>
              </div>
            </Field>
            {exactMatch ? (
              <p className="text-xs text-muted" data-testid="admin-exact-exists">
                “{exactMatch.label}” is already in this list
                {!exactMatch.active ? ' (archived)' : ''}.
              </p>
            ) : q.trim() && !tagsQuery.isFetching ? (
              <p className="text-xs text-muted">No exact match — Add to create it.</p>
            ) : null}
          </div>

          {tagsQuery.isLoading ? <LoadingBlock label="Loading tags…" /> : null}
          <AdminTagList
            tags={tags}
            loading={tagsQuery.isLoading}
            total={total}
            hasMore={Boolean(tagsQuery.hasNextPage)}
            loadingMore={tagsQuery.isFetchingNextPage}
            onLoadMore={() => void tagsQuery.fetchNextPage()}
            onArchive={(id) => archiveTag.mutate(id)}
            onRestore={(id) => restoreTag.mutate(id)}
            onDelete={(id) => deleteTag.mutate(id)}
            editPending={updateTag.isPending}
            onSaveEdit={async (id, label) => {
              try {
                await updateTag.mutateAsync({ id, label });
              } catch (err) {
                throw new Error(
                  err instanceof ApiError ? err.message : 'Could not update tag.',
                );
              }
            }}
          />

          <AdminBulkPastePanel
            canMutate={scopesReady}
            categoryLabel={categoryLabel}
            kind={kind}
            bulkText={bulkText}
            onBulkTextChange={(value) => {
              setBulkText(value);
              setPreview(null);
            }}
            preview={preview}
            onPreview={() => runPreview.mutate(bulkText)}
            onRefreshPreview={(text) => {
              setBulkText(text);
              runPreview.mutate(text);
            }}
            onCommit={() => {
              if (!categoryId || !kind || !preview) return;
              const labels = preview.rows
                .filter((r) => r.status === 'new')
                .map((r) => r.label.trim())
                .filter(Boolean);
              if (labels.length === 0) return;
              runCommit.mutate({ categoryId, kind, labels });
            }}
            onRemovePreviewRow={(index) => {
              setPreview((prev) => {
                if (!prev) return prev;
                const rows = prev.rows.filter((r) => r.index !== index);
                return recomputeBulkPreview(rows, existingLower);
              });
            }}
            onEditPreviewLabel={(index, label) => {
              setPreview((prev) => {
                if (!prev) return prev;
                const rows = prev.rows.map((r) =>
                  r.index === index ? { ...r, label } : r,
                );
                return recomputeBulkPreview(rows, existingLower);
              });
            }}
            previewPending={runPreview.isPending}
            commitPending={runCommit.isPending}
          />
        </>
      )}
    </div>
  );
}
