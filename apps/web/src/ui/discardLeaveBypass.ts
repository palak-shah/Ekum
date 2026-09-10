/**
 * BM: Back uses tryLeave → Leave runs navigate() → useBlocker would open the
 * discard sheet a second time unless we arm bypass first.
 */
export function armDiscardLeaveBypass(bypassRef: { current: boolean }): void {
  bypassRef.current = true;
}
