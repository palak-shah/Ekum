import {
  MasterOptionKind,
  type MasterOptionKind as OptionKind,
} from '@ekum/domain-types';

export const KIND_LABEL: Record<OptionKind, string> = {
  [MasterOptionKind.ItemType]: 'Product / Item type',
  [MasterOptionKind.Quality]: 'Quality / work',
  [MasterOptionKind.Size]: 'Size / dimension',
};

export type AdminTagRow = {
  id: string;
  kind: string;
  label: string;
  active: boolean;
  categories: { id: string; slug: string; label: string }[];
};

export type BulkPreviewRowStatus =
  | 'new'
  | 'existing'
  | 'duplicate_in_paste'
  | 'invalid';

export type BulkPreviewRow = {
  index: number;
  label: string;
  status: BulkPreviewRowStatus;
  reason?: string;
};

export type BulkPreview = {
  rows: BulkPreviewRow[];
  summary: {
    new: number;
    existing: number;
    duplicateInPaste: number;
    invalid: number;
  };
};

/** Re-classify preview rows after local edits (mirrors API buildBulkPreview rules). */
export function recomputeBulkPreview(
  rows: Array<{ index: number; label: string }>,
  existingLower: Set<string>,
): BulkPreview {
  const seenInPaste = new Set<string>();
  const nextRows: BulkPreviewRow[] = rows.map((row) => {
    const label = row.label;
    const trimmed = label.trim();
    if (!trimmed || trimmed.length > 80) {
      return {
        index: row.index,
        label,
        status: 'invalid' as const,
        reason: !trimmed ? 'Empty' : 'Too long (max 80)',
      };
    }
    const key = trimmed.toLowerCase();
    if (seenInPaste.has(key)) {
      return {
        index: row.index,
        label,
        status: 'duplicate_in_paste' as const,
        reason: 'Repeated in this paste',
      };
    }
    seenInPaste.add(key);
    if (existingLower.has(key)) {
      return {
        index: row.index,
        label,
        status: 'existing' as const,
        reason: 'Already in master data for this category',
      };
    }
    return { index: row.index, label, status: 'new' as const };
  });
  return {
    rows: nextRows,
    summary: {
      new: nextRows.filter((r) => r.status === 'new').length,
      existing: nextRows.filter((r) => r.status === 'existing').length,
      duplicateInPaste: nextRows.filter((r) => r.status === 'duplicate_in_paste')
        .length,
      invalid: nextRows.filter((r) => r.status === 'invalid').length,
    },
  };
}

export type BulkCommitResult = {
  created: number;
  skippedDuplicates: number;
  invalid: number;
  failed: number;
};

export type AdminTagListPage = {
  items: AdminTagRow[];
  total: number;
  take: number;
  skip: number;
};

export const ADMIN_TAG_PAGE_SIZE = 25;
