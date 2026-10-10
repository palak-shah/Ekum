/**
 * BM-07 / iOS Safari: keep the mobile shell from growing past the viewport when
 * a child (qty chip rail, default input min-width, etc.) wants more horizontal
 * space. Overflow must clip — not shove fixed bottom nav off-screen.
 *
 * Use `overflow-x-clip` (not `hidden`): `hidden` makes overflow-y compute to
 * `auto`, which creates a scrollport and kills sticky shell titles (You / Home).
 */
export const SHELL_X_CONTAIN_CLASS = 'min-w-0 overflow-x-clip';

/**
 * AppShell column: always viewport-tall; scroll lives in `main` so the scrollbar
 * is on the phone frame (not the laptop window edge).
 */
export const SHELL_FRAME_CLASS = 'h-full min-h-0 overflow-hidden';

/** Main scrollport inside the phone column — see `.ekum-shell-scroll` in index.css. */
export const SHELL_MAIN_SCROLL_CLASS =
  'ekum-shell-scroll min-h-0 flex-1 overflow-y-auto overflow-x-clip';

/**
 * Form controls without an explicit width use a large intrinsic min-size on
 * WebKit and can expand the page. Bound to the content column — but do not
 * force `w-full` when the caller already set a compact width (Dispatch / HowManyEach
 * qty). `w-full` + `w-20` both stay in the class list; without merge, `w-full` wins
 * and covers the design name (BM-07).
 */
export const FORM_CONTROL_WIDTH_CLASS = 'box-border min-w-0 max-w-full';

const WIDTH_TOKEN = /(?:^|\s)(?:\S+:)*w-/;
const PAD_TOKEN = /(?:^|\s)(?:\S+:)*(?:p|px|py|pt|pr|pb|pl)-/;
const MIN_H_TOKEN = /(?:^|\s)(?:\S+:)*min-h-/;
const TEXT_SIZE_TOKEN = /(?:^|\s)(?:\S+:)*text-(?:xs|sm|base|lg|xl|\[)/;
const BORDER_TOKEN = /(?:^|\s)(?:\S+:)*border(?:-|$)/;
const ROUNDED_TOKEN = /(?:^|\s)(?:\S+:)*rounded-/;
const BG_TOKEN = /(?:^|\s)(?:\S+:)*bg-/;

/** Full-width unless `className` already includes a `w-*` token. */
export function formControlWidthClass(className?: string): string {
  const hasWidth = Boolean(className && WIDTH_TOKEN.test(` ${className}`));
  return [FORM_CONTROL_WIDTH_CLASS, !hasWidth ? 'w-full' : ''].filter(Boolean).join(' ');
}

/**
 * Kit `TextInput` chrome. `cx` does not merge Tailwind conflicts — skip defaults
 * when the caller already set pad / min-height / text size / border (quiet sheet nums).
 */
export function textInputChromeClass(
  className?: string,
  opts?: { locked?: boolean },
): string {
  const src = className ? ` ${className}` : '';
  const hasPad = PAD_TOKEN.test(src);
  const hasMinH = MIN_H_TOKEN.test(src);
  const hasText = TEXT_SIZE_TOKEN.test(src);
  const hasBorder = BORDER_TOKEN.test(src);
  const hasRounded = ROUNDED_TOKEN.test(src);
  const hasBg = BG_TOKEN.test(src);
  const locked = opts?.locked === true;
  return [
    formControlWidthClass(className),
    !hasMinH ? 'min-h-10' : '',
    !hasRounded ? 'rounded-xl' : '',
    !hasBorder ? 'border border-line' : '',
    locked ? 'bg-foam/90 text-muted' : !hasBg ? 'bg-input text-ink' : 'text-ink',
    !hasPad ? 'px-3.5' : '',
    !hasText ? 'text-base' : '',
    'select-text font-medium outline-none placeholder:italic placeholder:font-normal placeholder:text-muted/50',
    locked ? 'focus:border-line' : 'focus:border-accent',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Compact piece-count beside a design name / fact strip.
 * Shorter than kit 40px so Dispatch This LR doesn’t dwarf Qty·Ship·Balance.
 */
export const COMPACT_QTY_INPUT_CLASS =
  'w-14 max-w-14 shrink-0 min-h-8 px-1 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

/**
 * Quiet qty in Send quote / mill grids — short field, soft border (not a big box).
 */
export const COMPACT_SHEET_NUM_INPUT_CLASS =
  'min-h-8 w-full min-w-0 rounded-lg border border-line/40 bg-foam/50 px-1.5 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

/** Quiet rate — soft chrome; pad so 4–6 digit rupees stay readable. */
export const COMPACT_SHEET_RATE_INPUT_CLASS =
  'min-h-8 w-full min-w-0 rounded-lg border border-line/40 bg-foam/50 px-2 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
