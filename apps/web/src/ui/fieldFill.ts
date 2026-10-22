/**
 * Idle fill for every typed / select field. Hex is `--ekum-input` in tokens.css.
 * Change that token (or this class string) once — Collection name, chat, − n +,
 * selects, and composers all follow. Do not paint a page-local bg-* on a field.
 */
export const FIELD_IDLE_FILL_CLASS = 'bg-input';

/** Focused typed field → surface (white / dark card). */
export const FIELD_FOCUS_FILL_CLASS = 'focus:bg-surface';

/** Cluster wrapping a transparent inner input (rate ₹, set-contains). */
export const FIELD_FOCUS_WITHIN_FILL_CLASS = 'focus-within:bg-surface';

export const FIELD_IDLE_AND_FOCUS_FILL_CLASS = `${FIELD_IDLE_FILL_CLASS} text-ink ${FIELD_FOCUS_FILL_CLASS}`;

/** Native <select> that looks like a kit field — callers add height / pad. */
export const SELECT_FIELD_CLASS = [
  'rounded-xl border border-line',
  FIELD_IDLE_FILL_CLASS,
  'outline-none',
  FIELD_FOCUS_FILL_CLASS,
].join(' ');

/** Chat Message / share composer well — inner textarea stays transparent. */
export const COMPOSER_SHELL_CLASS = `rounded-2xl border border-line ${FIELD_IDLE_FILL_CLASS}`;
