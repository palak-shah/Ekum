import { useState } from 'react';
import { Button, EmptyState, Field, Sheet, StatusPill, TextInput, cx } from '@/ui/kit';
import type { AdminTagRow } from './adminTagKinds';

export function AdminTagList({
  tags,
  loading,
  total,
  hasMore,
  loadingMore,
  onLoadMore,
  onArchive,
  onRestore,
  onDelete,
  onSaveEdit,
  editPending,
}: {
  tags: AdminTagRow[];
  loading: boolean;
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, label: string) => Promise<void> | void;
  editPending: boolean;
}) {
  const [editing, setEditing] = useState<AdminTagRow | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = (tag: AdminTagRow) => {
    setEditing(tag);
    setEditLabel(tag.label);
    setEditError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditLabel('');
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editing || !editLabel.trim()) return;
    try {
      setEditError(null);
      await onSaveEdit(editing.id, editLabel.trim());
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not save.');
    }
  };

  if (loading) return null;

  if (tags.length === 0) {
    return (
      <EmptyState
        title="No tags yet"
        message="Search above, or Add if the name is new for this category and type."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid="admin-tag-list">
      <p className="text-sm text-muted">
        Showing {tags.length} of {total}
      </p>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {tags.map((tag) => (
          <li
            key={tag.id}
            className="flex items-center gap-2 px-3 py-2"
            data-testid="admin-tag-row"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cx(
                    'truncate text-sm font-emphasis text-ink',
                    !tag.active && 'text-muted line-through',
                  )}
                >
                  {tag.label}
                </p>
                <StatusPill
                  status={tag.active ? 'published' : 'archived'}
                  label={tag.active ? 'Active' : 'Archived'}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className="min-h-12 rounded-lg px-2 text-xs font-emphasis text-accent"
                onClick={() => openEdit(tag)}
                data-testid="admin-tag-edit"
              >
                Edit
              </button>
              {tag.active ? (
                <button
                  type="button"
                  className="min-h-12 rounded-lg px-2 text-xs font-body text-muted"
                  onClick={() => {
                    if (window.confirm(`Archive “${tag.label}”?`)) {
                      onArchive(tag.id);
                    }
                  }}
                  data-testid="admin-tag-archive"
                >
                  Archive
                </button>
              ) : (
                <button
                  type="button"
                  className="min-h-12 rounded-lg px-2 text-xs font-emphasis text-accent"
                  onClick={() => {
                    if (window.confirm(`Restore “${tag.label}”?`)) {
                      onRestore(tag.id);
                    }
                  }}
                  data-testid="admin-tag-restore"
                >
                  Restore
                </button>
              )}
              <button
                type="button"
                className="min-h-12 rounded-lg px-2 text-xs font-emphasis text-danger"
                onClick={() => {
                  if (window.confirm(`Delete “${tag.label}”?`)) {
                    onDelete(tag.id);
                  }
                }}
                data-testid="admin-tag-delete"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={loadingMore}
          onClick={onLoadMore}
          data-testid="admin-tags-load-more"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}

      <Sheet
        open={Boolean(editing)}
        onClose={closeEdit}
        title="Edit tag"
        footer={
          <Button
            fullWidth
            disabled={!editLabel.trim() || editPending}
            onClick={() => void saveEdit()}
            data-testid="admin-tag-edit-save"
          >
            Save
          </Button>
        }
      >
        <Field label="Tag name">
          <TextInput
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            data-testid="admin-tag-edit-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editLabel.trim() && !editPending) {
                e.preventDefault();
                void saveEdit();
              }
            }}
          />
        </Field>
        {editError ? <p className="mt-2 text-sm text-danger">{editError}</p> : null}
      </Sheet>
    </div>
  );
}
