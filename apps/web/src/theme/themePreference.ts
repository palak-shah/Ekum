export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const EKUM_DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

const STORAGE_PREFIX = 'ekum.theme';
/** Last written preference — FOUC before auth knows userId. */
const LAST_KEY = 'ekum.theme.last';
const RESOLVED_KEY = 'ekum.theme.resolved';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}.${userId}`;
}

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isResolved(value: unknown): value is ResolvedTheme {
  return value === 'light' || value === 'dark';
}

/** Personal last-wins. Missing / invalid / no user → System. */
export function readThemePreference(userId: string | null | undefined): ThemePreference {
  if (!userId) return EKUM_DEFAULT_THEME_PREFERENCE;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (isPreference(raw)) return raw;
  } catch {
    /* private mode / quota */
  }
  return EKUM_DEFAULT_THEME_PREFERENCE;
}

/** Persist last choice for this person. No-op without userId. */
export function writeThemePreference(
  userId: string | null | undefined,
  preference: ThemePreference,
): void {
  if (!userId || !isPreference(preference)) return;
  try {
    localStorage.setItem(storageKey(userId), preference);
    localStorage.setItem(LAST_KEY, JSON.stringify({ userId, preference }));
  } catch {
    /* ignore */
  }
}

/** Preference used before paint / when userId unknown (last signed-in person). */
export function readLastThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return EKUM_DEFAULT_THEME_PREFERENCE;
    const parsed = JSON.parse(raw) as { preference?: unknown };
    if (isPreference(parsed?.preference)) return parsed.preference;
  } catch {
    /* ignore */
  }
  return EKUM_DEFAULT_THEME_PREFERENCE;
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark?: boolean,
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  if (typeof prefersDark === 'boolean') return prefersDark ? 'dark' : 'light';
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
  root.style.colorScheme = resolved;
  try {
    localStorage.setItem(RESOLVED_KEY, resolved);
  } catch {
    /* ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const canvas = getComputedStyle(root).getPropertyValue('--ekum-canvas').trim();
    meta.setAttribute('content', canvas || (resolved === 'dark' ? '#0c0a09' : '#ffffff'));
  }
}

export function readStoredResolvedTheme(): ResolvedTheme | null {
  try {
    const raw = localStorage.getItem(RESOLVED_KEY);
    if (isResolved(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}
