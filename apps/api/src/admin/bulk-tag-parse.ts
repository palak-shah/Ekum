/**
 * Parse admin bulk-paste input (comma, newline, tab, Excel column clipboard).
 */

export type BulkParseRowStatus = 'new' | 'existing' | 'duplicate_in_paste' | 'invalid';

export type BulkParseRow = {
  index: number;
  label: string;
  status: BulkParseRowStatus;
  reason?: string;
};

export function parseBulkTagInput(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parts = normalized.split(/[\n\t,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    out.push(trimmed);
  }
  return out;
}

export function buildBulkPreview(
  labels: string[],
  existingLower: Set<string>,
): BulkParseRow[] {
  const seenInPaste = new Set<string>();
  return labels.map((label, index) => {
    if (!label || label.length > 80) {
      return {
        index,
        label,
        status: 'invalid' as const,
        reason: !label ? 'Empty' : 'Too long (max 80)',
      };
    }
    const key = label.toLowerCase();
    if (seenInPaste.has(key)) {
      return {
        index,
        label,
        status: 'duplicate_in_paste' as const,
        reason: 'Repeated in this paste',
      };
    }
    seenInPaste.add(key);
    if (existingLower.has(key)) {
      return {
        index,
        label,
        status: 'existing' as const,
        reason: 'Already in master data for this category',
      };
    }
    return { index, label, status: 'new' as const };
  });
}
