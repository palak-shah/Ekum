export type SelectAllAction = 'select-all' | 'clear';

export function selectAllState(
  visibleIds: readonly string[],
  selectedIds: Iterable<string>,
): { allSelected: boolean; action: SelectAllAction } {
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  return { allSelected, action: allSelected ? 'clear' : 'select-all' };
}

export function nextIdSet(
  visibleIds: readonly string[],
  selectedIds: Iterable<string>,
): Set<string> {
  const { allSelected } = selectAllState(visibleIds, selectedIds);
  const next = selectedIds instanceof Set ? new Set(selectedIds) : new Set(selectedIds);
  if (allSelected) {
    for (const id of visibleIds) next.delete(id);
  } else {
    for (const id of visibleIds) next.add(id);
  }
  return next;
}
