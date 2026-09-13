export type DesignBrowseLayout = 'feed' | 'grid';

/** Ekum system default when the trader has never chosen. */
export const EKUM_DEFAULT_DESIGN_BROWSE_LAYOUT: DesignBrowseLayout = 'feed';

const STORAGE_PREFIX = 'ekum.designBrowseLayout';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}.${companyId}`;
}

function isLayout(value: unknown): value is DesignBrowseLayout {
  return value === 'feed' || value === 'grid';
}

/** Personal last-wins Feed/Grid. Missing or invalid → Ekum default (feed). */
export function readDesignBrowseLayout(
  companyId: string | null | undefined,
): DesignBrowseLayout {
  if (!companyId) return EKUM_DEFAULT_DESIGN_BROWSE_LAYOUT;
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (isLayout(raw)) return raw;
  } catch {
    /* private mode / quota */
  }
  return EKUM_DEFAULT_DESIGN_BROWSE_LAYOUT;
}

/** Persist last choice. No-op without companyId. */
export function writeDesignBrowseLayout(
  companyId: string | null | undefined,
  layout: DesignBrowseLayout,
): void {
  if (!companyId || !isLayout(layout)) return;
  try {
    localStorage.setItem(storageKey(companyId), layout);
  } catch {
    /* ignore */
  }
}
