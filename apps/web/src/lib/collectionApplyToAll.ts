/** Last “Apply this info to all designs” choice. First visit is off. */

const STORAGE_PREFIX = 'ekum.collectionApplyToAll';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}.${companyId}`;
}

/** Never stored → off. Traders opt in, then we keep that for the next pack. */
export function readCollectionApplyToAll(
  companyId: string | null | undefined,
): boolean {
  if (!companyId) return false;
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    /* private mode / quota */
  }
  return false;
}

export function writeCollectionApplyToAll(
  companyId: string | null | undefined,
  apply: boolean,
): void {
  if (!companyId) return;
  try {
    localStorage.setItem(storageKey(companyId), apply ? '1' : '0');
  } catch {
    /* ignore */
  }
}
