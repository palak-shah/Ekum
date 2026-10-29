export function orderSheetTitle(
  count: number,
  opts?: { catalogName?: string | null; catalogOnly?: boolean },
): string {
  const catalogName = opts?.catalogName?.trim();
  if (opts?.catalogOnly && catalogName) return catalogName;
  return count === 1 ? '1 design' : `${count} designs`;
}

export type QtyMode = 'same' | 'perDesign';
