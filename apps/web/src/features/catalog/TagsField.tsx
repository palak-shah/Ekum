import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogTagView, CreateCatalogTagDto } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { Button, Field, Sheet, TextInput, cx } from '@/ui/kit';

const MAX_SELECTED = 20;

/** Compact tags row + sheet picker (official + company custom). */
export function TagsField({
  value,
  onChange,
  label = 'Tags',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const summary =
    value.length === 0
      ? 'Add tags for search'
      : value.length <= 3
        ? value.join(' · ')
        : `${value.slice(0, 2).join(' · ')} · +${value.length - 2}`;

  return (
    <>
      <Field label={label}>
        <button
          type="button"
          data-testid="tags-field-open"
          onClick={() => setOpen(true)}
          className="flex min-h-12 w-full flex-col gap-1 rounded-xl border border-line bg-surface px-3 py-2 text-left"
        >
          <span
            className={cx(
              'line-clamp-2 text-sm',
              value.length ? 'font-medium text-ink' : 'text-muted',
            )}
          >
            {summary}
          </span>
          {value.length > 0 ? (
            <div className="ekum-no-scrollbar max-h-[4.5rem] overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {value.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-foam px-2 py-0.5 text-xs font-semibold text-ink"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </button>
      </Field>
      <TagsPickerSheet
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
      />
    </>
  );
}

export function TagsPickerSheet({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tags = useQuery({
    queryKey: ['catalog-tags'],
    queryFn: () => api.get<CatalogTagView[]>('/catalog/tags'),
    enabled: open,
  });

  const createTag = useMutation({
    mutationFn: (dto: CreateCatalogTagDto) =>
      api.post<CatalogTagView>('/catalog/tags', dto),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['catalog-tags'] });
      toggle(created.label, true);
      setCustomLabel('');
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not add tag.');
    },
  });

  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);

  const official = useMemo(
    () => (tags.data ?? []).filter((t) => t.scope === 'official'),
    [tags.data],
  );
  const custom = useMemo(
    () => (tags.data ?? []).filter((t) => t.scope === 'company'),
    [tags.data],
  );

  const needle = q.trim().toLowerCase();
  const filterList = (list: CatalogTagView[]) =>
    !needle
      ? list
      : list.filter((t) => t.label.toLowerCase().includes(needle));

  const toggle = (label: string, forceOn?: boolean) => {
    const key = label.toLowerCase();
    const on = forceOn ?? !selected.has(key);
    if (on) {
      if (value.length >= MAX_SELECTED && !selected.has(key)) return;
      if (selected.has(key)) return;
      onChange([...value, label]);
    } else {
      onChange(value.filter((v) => v.toLowerCase() !== key));
    }
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    createTag.mutate({ label });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Tags"
      footer={
        <Button fullWidth onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tags"
          autoComplete="off"
        />

        {value.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted">Selected</p>
            <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
              {value.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag, false)}
                  className="rounded-lg border border-accent bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <TagChipSection
          title="From categories"
          loading={tags.isLoading}
          tags={filterList(official)}
          selected={selected}
          onToggle={toggle}
        />
        <TagChipSection
          title="Your tags"
          loading={false}
          tags={filterList(custom)}
          selected={selected}
          onToggle={toggle}
          empty="No custom tags yet — add one below."
        />

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="text-xs font-semibold text-muted">Add your tag</p>
          <div className="flex gap-2">
            <TextInput
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Fendi feel"
              className="min-w-0 flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!customLabel.trim() || createTag.isPending}
              onClick={addCustom}
            >
              Add
            </Button>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <p className="text-xs text-muted">
            Only you see this when tagging. Buyers can still find it in search.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

function TagChipSection({
  title,
  tags,
  selected,
  onToggle,
  loading,
  empty,
}: {
  title: string;
  tags: CatalogTagView[];
  selected: Set<string>;
  onToggle: (label: string) => void;
  loading: boolean;
  empty?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted">{title}</p>
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted">{empty ?? 'None match.'}</p>
      ) : (
        <div className="ekum-no-scrollbar flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {tags.map((tag) => {
            const on = selected.has(tag.label.toLowerCase());
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggle(tag.label)}
                className={cx(
                  'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                  on
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line bg-surface text-ink',
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
