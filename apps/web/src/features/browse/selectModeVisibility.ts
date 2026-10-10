/** Idle shows Select; Selecting shows count + optional Select all + Clear. */
export function selectModeShowsEnter(selecting: boolean): boolean {
  return !selecting;
}

export function selectModeShowsActiveChrome(selecting: boolean): boolean {
  return selecting;
}

export function selectModeShowsSelectAll(
  selecting: boolean,
  showSelectAll: boolean,
): boolean {
  return selecting && showSelectAll;
}
