import type { MasterOptionKind as OptionKind } from '@ekum/domain-types';
import { Button, Field, TextArea, TextInput, cx } from '@/ui/kit';
import { KIND_LABEL, type BulkPreview } from './adminTagKinds';

/** Excel / CSV-style bulk paste — separate from the unified search/add field. */
export function AdminBulkPastePanel({
  canMutate,
  categoryLabel,
  kind,
  bulkText,
  onBulkTextChange,
  preview,
  onPreview,
  onRefreshPreview,
  onCommit,
  onRemovePreviewRow,
  onEditPreviewLabel,
  previewPending,
  commitPending,
}: {
  canMutate: boolean;
  categoryLabel: string;
  kind: OptionKind | '';
  bulkText: string;
  onBulkTextChange: (value: string) => void;
  preview: BulkPreview | null;
  onPreview: () => void;
  onRefreshPreview: (text: string) => void;
  onCommit: () => void;
  onRemovePreviewRow: (index: number) => void;
  onEditPreviewLabel: (index: number, label: string) => void;
  previewPending: boolean;
  commitPending: boolean;
}) {
  const kindLabel = kind ? KIND_LABEL[kind] : '';

  return (
    <div className="rounded-xl border border-line p-3" data-testid="admin-bulk-paste-panel">
      <p className="mb-1 text-sm font-emphasis text-ink">Bulk paste</p>
      {canMutate ? (
        <p className="mb-2 text-xs text-muted">
          {categoryLabel} · {kindLabel}
        </p>
      ) : (
        <p className="mb-2 text-xs text-muted">Pick category and option type first.</p>
      )}
      <Field label="Paste from Excel or list">
        <TextArea
          value={bulkText}
          onChange={(e) => onBulkTextChange(e.target.value)}
          placeholder="Comma, tab, or one per line"
          rows={3}
          disabled={!canMutate}
          data-testid="admin-bulk-textarea"
        />
      </Field>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={!canMutate || !bulkText.trim() || previewPending}
          onClick={onPreview}
          data-testid="admin-bulk-preview"
        >
          Preview
        </Button>
        <Button
          disabled={!preview || preview.summary.new === 0 || commitPending}
          onClick={onCommit}
          data-testid="admin-bulk-commit"
        >
          Save new ({preview?.summary.new ?? 0})
        </Button>
      </div>
      {preview ? (
        <div className="mt-2 space-y-2 text-sm" data-testid="admin-bulk-preview-list">
          <p className="text-muted">
            New {preview.summary.new} · Existing {preview.summary.existing} · Repeated{' '}
            {preview.summary.duplicateInPaste} · Invalid {preview.summary.invalid}
          </p>
          <ul className="max-h-40 overflow-y-auto rounded-lg bg-foam p-2">
            {preview.rows.map((row) => (
              <li
                key={`${row.index}-${row.status}`}
                className={cx(
                  'flex items-center gap-2 border-b border-line/60 py-1.5 last:border-0',
                  row.status === 'new' ? 'text-ink' : 'text-muted',
                )}
                data-testid="admin-bulk-preview-row"
              >
                <TextInput
                  value={row.label}
                  onChange={(e) => onEditPreviewLabel(row.index, e.target.value)}
                  className="min-w-0 flex-1"
                  aria-label={`Preview row ${row.index + 1}`}
                />
                <span className="shrink-0 text-[10px] font-body uppercase tracking-wide">
                  {row.status === 'duplicate_in_paste' ? 'repeated' : row.status}
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-body text-muted"
                  onClick={() => onRemovePreviewRow(row.index)}
                  aria-label={`Remove ${row.label || 'row'}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            disabled={previewPending || preview.rows.length === 0}
            onClick={() => onRefreshPreview(preview.rows.map((r) => r.label).join('\n'))}
            data-testid="admin-bulk-refresh-preview"
          >
            Refresh preview
          </Button>
        </div>
      ) : null}
    </div>
  );
}
