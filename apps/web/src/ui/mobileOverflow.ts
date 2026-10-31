import {
  compactQtyInputClass,
  compactSheetNumInputClass,
  compactSheetRateInputClass,
} from '@/ui/designLineChrome';
import { FIELD_IDLE_AND_FOCUS_FILL_CLASS } from '@/ui/fieldFill';

export {
  COMPOSER_SHELL_CLASS,
  FIELD_FOCUS_FILL_CLASS,
  FIELD_FOCUS_WITHIN_FILL_CLASS,
  FIELD_IDLE_AND_FOCUS_FILL_CLASS,
  FIELD_IDLE_FILL_CLASS,
  SELECT_FIELD_CLASS,
} from '@/ui/fieldFill';

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
 * Horizontal photo strip in a vertical feed (Explore).
 * `touch-pan-x` alone is `touch-action: pan-x` — iPhone then swallows vertical
 * flicks that start on the image. Both axes: swipe photos, scroll the feed.
 */
export const PHOTO_STRIP_TOUCH_CLASS = 'touch-[pan-x_pan-y] overscroll-x-contain';

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
const FONT_WEIGHT_TOKEN =
  /(?:^|\s)(?:\S+:)*font-(?:body|emphasis|title|bold|medium|semibold|normal)\b/;
const BORDER_TOKEN = /(?:^|\s)(?:\S+:)*border(?:-|$)/;
const ROUNDED_TOKEN = /(?:^|\s)(?:\S+:)*rounded-/;
const BG_TOKEN = /(?:^|\s)(?:\S+:)*bg-/;
const PLACEHOLDER_TOKEN = /(?:^|\s)(?:\S+:)*placeholder:/;

/**
 * All kit field placeholders: 14px roman muted (same as Category / Rate).
 * Typed text stays `text-base` so iOS does not zoom on focus.
 */
export const FIELD_PLACEHOLDER_CLASS =
  'placeholder:not-italic placeholder:font-body placeholder:text-sm placeholder:text-muted';

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
  const hasFont = FONT_WEIGHT_TOKEN.test(src);
  const hasBorder = BORDER_TOKEN.test(src);
  const hasRounded = ROUNDED_TOKEN.test(src);
  const hasBg = BG_TOKEN.test(src);
  const hasPlaceholder = PLACEHOLDER_TOKEN.test(src);
  const locked = opts?.locked === true;
  return [
    formControlWidthClass(className),
    !hasMinH ? 'min-h-12' : '',
    !hasRounded ? 'rounded-xl' : '',
    !hasBorder ? 'border border-line' : '',
    locked
      ? 'bg-foam/90 text-muted'
      : !hasBg
        ? FIELD_IDLE_AND_FOCUS_FILL_CLASS
        : 'text-ink',
    !hasPad ? 'px-3.5' : '',
    !hasText ? 'text-base' : '',
    'select-text outline-none',
    !hasFont ? 'font-body' : '',
    !hasPlaceholder ? FIELD_PLACEHOLDER_CLASS : '',
    'focus:border-line',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Compact piece-count beside a design name / fact strip.
 * Alias of `compactQtyInputClass` — change height/type there only.
 */
export const COMPACT_QTY_INPUT_CLASS = compactQtyInputClass;

/**
 * Quiet qty in Send quote / mill grids — short field, soft border (not a big box).
 */
export const COMPACT_SHEET_NUM_INPUT_CLASS = compactSheetNumInputClass;

/** Quiet rate — soft chrome; pad so 4–6 digit rupees stay readable. */
export const COMPACT_SHEET_RATE_INPUT_CLASS = compactSheetRateInputClass;