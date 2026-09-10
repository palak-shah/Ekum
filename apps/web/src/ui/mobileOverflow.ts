/**
 * BM-07 / iOS Safari: keep the mobile shell from growing past the viewport when
 * a child (qty chip rail, default input min-width, etc.) wants more horizontal
 * space. Overflow must clip — not shove fixed bottom nav off-screen.
 */
export const SHELL_X_CONTAIN_CLASS = 'min-w-0 overflow-x-hidden';

/**
 * Form controls without an explicit width use a large intrinsic min-size on
 * WebKit and can expand the page. Bound to the content column — but do not
 * force `w-full` when the caller already set a compact width (Dispatch / HowManyEach
 * qty). `w-full` + `w-20` both stay in the class list; without merge, `w-full` wins
 * and covers the design name (BM-07).
 */
export const FORM_CONTROL_WIDTH_CLASS = 'box-border min-w-0 max-w-full';

const WIDTH_TOKEN = /(?:^|\s)(?:\S+:)*w-/;

/** Full-width unless `className` already includes a `w-*` token. */
export function formControlWidthClass(className?: string): string {
  const hasWidth = Boolean(className && WIDTH_TOKEN.test(` ${className}`));
  return [FORM_CONTROL_WIDTH_CLASS, !hasWidth ? 'w-full' : ''].filter(Boolean).join(' ');
}

/** Compact piece-count field beside a design name. */
export const COMPACT_QTY_INPUT_CLASS = 'w-20 max-w-20 shrink-0 min-h-10 px-2 text-center';
