/**
 * Orders / Instagram underline tab language — one dialect for Orders, Home, You.
 * Selected = charcoal text-accent + h-1 bg-accent bar. Never border-badge / lime rails.
 */
export function underlineTabChrome(active: boolean): {
  buttonClass: string;
  barClass: string;
} {
  return {
    buttonClass: active ? 'font-emphasis text-accent' : 'font-body text-muted',
    barClass: active ? 'bg-accent' : 'bg-transparent',
  };
}

/** Absolute bar under the tab label — pair with `relative` on the button. */
export const UNDERLINE_TAB_BAR_BASE_CLASS = 'absolute inset-x-0 bottom-0 h-1';

/**
 * You / Home kind tabs — same selected language as Orders (via underlineTabChrome).
 * Kept for call-site clarity; do not invent a second selected dialect.
 */
export function youLibraryKindTabSelectedClass(active: boolean): string {
  return underlineTabChrome(active).buttonClass;
}
