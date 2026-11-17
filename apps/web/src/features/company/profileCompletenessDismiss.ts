const STORAGE_PREFIX = 'ekum.profileCompletenessDismissed';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}.${companyId}`;
}

/** Soft dismiss — hide until the incomplete-set fingerprint changes. */
export function readProfileCompletenessDismissed(
  companyId: string | null | undefined,
): string | null {
  if (!companyId) return null;
  try {
    return localStorage.getItem(storageKey(companyId));
  } catch {
    return null;
  }
}

export function writeProfileCompletenessDismissed(
  companyId: string | null | undefined,
  fingerprint: string,
): void {
  if (!companyId || !fingerprint) return;
  try {
    localStorage.setItem(storageKey(companyId), fingerprint);
  } catch {
    /* private mode / quota */
  }
}

export function isProfileCompletenessDismissed(
  companyId: string | null | undefined,
  fingerprint: string,
): boolean {
  if (!fingerprint) return false;
  return readProfileCompletenessDismissed(companyId) === fingerprint;
}
