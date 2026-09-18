import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogTagView, CreateCatalogTagDto } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { Button, Field, Sheet, TextInput, cx } from '@/ui/kit';

const MAX_SELECTED = 20;

/** Bucket key for official tags with no taxonomy parent. */
const UNGROUPED_PARENT = 'OTHER';

const PARENT_LABEL: Record<string, string> = {
  'HOME TEXTILES': 'Home textiles',
  'WOMENS WEAR': 'Womens wear',
  'MENS WEAR': 'Mens wear',
  FABRICS: 'Fabrics',
  ACCESSORIES: 'Accessories',
  'KIDS WEAR': 'Kids wear',
  [UNGROUPED_PARENT]: 'Other',
};

/** Stable group/filter key — null/empty parent → Other. */
export function parentBucketKey(parentKey: string | null | undefined): string {
  const trimmed = parentKey?.trim();
  return trimmed ? trimmed : UNGROUPED_PARENT;
}

export function parentTitle(key: string | null | undefined): string {
  const bucket = parentBucketKey(key);
  return PARENT_LABEL[bucket] ?? bucket;
}

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
  /** Prefetch so the closed row can hint what’s available. */
  const tags = useQuery({
    queryKey: ['catalog-tags'],
    queryFn: () => api.get<CatalogTagView[]>('/catalog/tags'),
  });
  const officialCount = (tags.data ?? []).filter((t) => t.scope === 'official').length;
  const sample = (tags.data ?? [])
    .filter((t) => t.scope === 'official')
    .slice(0, 3)
    .map((t) => t.label);

  const summary =
    value.length === 0
      ? sample.length > 0
        ? `Tap to choose · ${sample.join(', ')}${officialCount > 3 ? '…' : ''}`
        : 'Tap to see tags you can use'
      : value.length <= 3
        ? value.join(' · ')
        : `${value.slice(0, 2).join(' · ')} · +${value.length - 2}`;

  return (
    <>
      <Field
        label={label}
        hint="Buyers find this pack by these tags. Pick from the list or add your own."
      >
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
  const [parentFilter, setParentFilter] = useState<string | 'all'>('all');
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

  const parentKeys = useMemo(() => {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const tag of official) {
      const key = parentBucketKey(tag.parentKey);
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
    return keys;
  }, [official]);

  const needle = q.trim().toLowerCase();

  const filteredOfficial = useMemo(() => {
    let list = official;
    if (parentFilter !== 'all') {
      list = list.filter((t) => parentBucketKey(t.parentKey) === parentFilter);
    }
    if (needle) {
      list = list.filter(
        (t) =>
          t.label.toLowerCase().includes(needle) ||
          parentTitle(t.parentKey).toLowerCase().includes(needle) ||
          (t.parentKey ?? '').toLowerCase().includes(needle),
      );
    }
    return list;
  }, [official, parentFilter, needle]);

  const filteredCustom = useMemo(() => {
    if (!needle) return custom;
    return custom.filter((t) => t.label.toLowerCase().includes(needle));
  }, [custom, needle]);

  const groupedOfficial = useMemo(() => {
    const map = new Map<string, CatalogTagView[]>();
    for (const tag of filteredOfficial) {
      const key = parentBucketKey(tag.parentKey);
      const bucket = map.get(key) ?? [];
      bucket.push(tag);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [filteredOfficial]);

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
      onClose={() => {
        setQ('');
        setParentFilter('all');
        onClose();
      }}
      title="Choose tags"
      footer={
        <Button fullWidth onClick={onClose}>
          Done{value.length > 0 ? ` · ${value.length}` : ''}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Tap tags below for search. List matches what you sell
          {official.length > 0 ? ` · ${official.length} ready to use` : ''}.
        </p>

        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search — e.g. Kurti, Bedsheet, Denim"
          autoComplete="off"
          data-testid="tags-search"
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

        {!needle && parentKeys.length > 1 ? (
          <div
            className="ekum-no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5"
            data-testid="tags-parent-filter"
          >
            <FilterPill
              label="All"
              active={parentFilter === 'all'}
              onClick={() => setParentFilter('all')}
            />
            {parentKeys.map((key) => (
              <FilterPill
                key={key}
                label={parentTitle(key)}
                active={parentFilter === key}
                onClick={() => setParentFilter(key)}
              />
            ))}
          </div>
        ) : null}

        {tags.isLoading ? (
          <p className="text-sm text-muted">Loading tags…</p>
        ) : filteredOfficial.length === 0 && filteredCustom.length === 0 ? (
          <p className="text-sm text-muted">
            {needle
              ? 'No tag matches that search. Add your own below.'
              : 'No category tags yet — add your own below, or set sell categories on your profile.'}
          </p>
        ) : (
          <div className="ekum-no-scrollbar flex max-h-[min(52vh,28rem)] flex-col gap-4 overflow-y-auto">
            {groupedOfficial.map(([parent, list]) => (
              <TagChipSection
                key={parent}
                title={parentTitle(parent)}
                tags={list}
                selected={selected}
                onToggle={toggle}
              />
            ))}
            {filteredCustom.length > 0 || !needle ? (
              <TagChipSection
                title="Your tags"
                tags={filteredCustom}
                selected={selected}
                onToggle={toggle}
                empty="None yet — add one below for slang buyers search."
              />
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="text-xs font-semibold text-muted">Add your own tag</p>
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

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold',
        active ? 'bg-accent text-white' : 'bg-foam text-ink',
      )}
    >
      {label}
    </button>
  );
}

function TagChipSection({
  title,
  tags,
  selected,
  onToggle,
  empty,
}: {
  title: string;
  tags: CatalogTagView[];
  selected: Set<string>;
  onToggle: (label: string) => void;
  empty?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted">{title}</p>
      {tags.length === 0 ? (
        <p className="text-sm text-muted">{empty ?? 'None.'}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const on = selected.has(tag.label.toLowerCase());
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggle(tag.label)}
                className={cx(
                  'rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
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
