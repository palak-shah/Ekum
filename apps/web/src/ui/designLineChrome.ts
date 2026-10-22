import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';

/**
 * One place for design-line type and qty box.
 * Change name size, subtext color, or qty height here — order sheets follow.
 * Matches catalog cards / chat titles (not an order-only look).
 */

export const designNameClass = 'text-[15px] font-emphasis tracking-tight text-ink';

export const designSubtextClass = 'truncate text-[12px] font-body text-muted';

const QTY_SPIN_HIDE =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

/** Trailing count box: This LR, Final, amend, Last LR (typed field). */
export const compactQtyInputClass = [
  'w-12 max-w-12 shrink-0 h-8 min-h-8 px-1 text-center text-base font-emphasis tabular-nums',
  QTY_SPIN_HIDE,
].join(' ');

/** Whole − n + control: pill, no border; fill is the shared field token. */
export const stepperTrackClass =
  `inline-flex items-center rounded-full ${FIELD_IDLE_FILL_CLASS}`;

/** Number inside the pill — 14px (under the 15px name). Notes / search stay 16px. */
export const stepperQtyInputClass = [
  'w-8 max-w-8 shrink-0 h-8 min-h-8 border-0 bg-transparent px-0 text-center text-[14px] font-emphasis tabular-nums outline-none',
  QTY_SPIN_HIDE,
].join(' ');

/** Quiet Qty | Rate on quote / confirm / mill Change — same 14px emphasis as How many / Edit. */
export const compactSheetNumInputClass = [
  `min-h-8 w-full min-w-0 rounded-lg border border-line/40 ${FIELD_IDLE_FILL_CLASS} px-1.5 text-center text-[14px] font-emphasis tabular-nums`,
  QTY_SPIN_HIDE,
].join(' ');

export const compactSheetRateInputClass = [
  `min-h-8 w-full min-w-0 rounded-lg border border-line/40 ${FIELD_IDLE_FILL_CLASS} px-2 text-center text-[14px] font-emphasis tabular-nums`,
  QTY_SPIN_HIDE,
].join(' ');

/** − / + on How many, builder, Same for all — text, not a second box. 14px (not an input). */
export const stepperBtnClass =
  'flex h-7 w-7 shrink-0 items-center justify-center text-[14px] font-emphasis text-muted disabled:opacity-45';

export const compactQtyFieldLabelClass =
  'text-[10px] font-body uppercase tracking-wide text-muted';
