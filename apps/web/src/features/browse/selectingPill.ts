export function applySelectingPill(
  selectMode: boolean,
  count: number,
  shortlist: { clear: () => void; setSelectMode: (on: boolean) => void },
): void {
  if (!selectMode) {
    shortlist.setSelectMode(true);
    return;
  }
  if (count > 0) {
    shortlist.clear();
    return;
  }
  shortlist.setSelectMode(false);
}
