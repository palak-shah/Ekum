import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';

/**
 * One place for design-line type and qty box.
 * Change name size, subtext color, or qty height here — order sheets follow.
 * Matches catalog cards / chat titles (not an order-only look).
 */

/** Catalog / ticket / chat design name — shared 16px title weight. */
export const designNameClass = 'text-name font-title tracking-tight text-ink';

export const designSubtextClass = 'truncate text-meta font-body text-muted';

/**
 * Order ticket + Confirm/Dispatch rows — proto `.dl b` / `.dd .hd b`.
 * Name 14px/600 (not catalog 16px).
 */
export const sheetDesignNameClass =
  'text-[14px] font-title leading-snug tracking-tight text-ink';

export const sheetLineCueClass =
  'block text-[12.5px] font-body leading-snug text-muted';

/** Ticket qty under the name — muted pair with rate (prototype ladder). */
export const designQtyClass =
  'text-meta font-body tabular-nums leading-tight text-muted';

/** Ticket rate on the name row — same quiet rung as qty. */
export const designRateClass =
  'shrink-0 text-meta font-body tabular-nums text-muted';

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

/** Number inside the pill — 16px. Notes / search stay 16px. Box stays compact. */
export const stepperQtyInputClass = [
  'w-8 max-w-8 shrink-0 h-8 min-h-8 border-0 bg-transparent px-0 text-center text-base font-emphasis tabular-nums outline-none',
  QTY_SPIN_HIDE,
].join(' ');

/** Quiet Qty | Rate on quote / confirm / mill Change — 16px, same as How many / Edit. */
export const compactSheetNumInputClass = [
  `min-h-8 w-full min-w-0 rounded-lg border border-line/40 ${FIELD_IDLE_FILL_CLASS} px-1.5 text-center text-base font-emphasis tabular-nums`,
  QTY_SPIN_HIDE,
].join(' ');

export const compactSheetRateInputClass = [
  `min-h-8 w-full min-w-0 rounded-lg border border-line/40 ${FIELD_IDLE_FILL_CLASS} px-2 text-center text-base font-emphasis tabular-nums`,
  QTY_SPIN_HIDE,
].join(' ');

/** − / + on How many, builder, Same for all — text, not a second box. Compact (not 48). */
export const stepperBtnClass =
  'flex h-7 w-7 shrink-0 items-center justify-center text-base font-emphasis text-muted disabled:opacity-45';

/** Confirm / Dispatch sheet − / + — ~proto 34px hits. */
export const sheetStepperBtnClass =
  'flex h-[34px] w-[34px] shrink-0 items-center justify-center text-base font-emphasis text-muted disabled:opacity-45';

export const compactQtyFieldLabelClass =
  'text-[10px] font-body uppercase tracking-wide text-muted';

/**
 * Confirm / Dispatch / Settle editors — bordered surface (no bg-input).
 * How many / Amend keep foam-pill `stepperTrackClass`.
 */
/** Full-width track: − left · qty center · + right (not a left-clustered pill). */
export const sheetStepperTrackClass =
  'flex h-10 w-full items-center justify-between rounded-lg border border-line bg-surface px-0.5';

/** Number in the sheet track — grows so − / + sit on the ends (proto `.step span`). */
export const sheetStepperQtyInputClass = [
  'min-w-0 flex-1 h-8 min-h-8 border-0 bg-transparent px-0 text-center text-base font-title tabular-nums outline-none',
  QTY_SPIN_HIDE,
].join(' ');

export const sheetNumInputClass = [
  'h-10 min-h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-center text-base font-emphasis tabular-nums',
  QTY_SPIN_HIDE,
].join(' ');

export const sheetRateInputClass = [
  'h-10 min-h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 text-left text-base font-emphasis tabular-nums',
  QTY_SPIN_HIDE,
].join(' ');

/** Free-text on order sheets (Manual, transporter, LR, parcels). */
export const sheetTextInputClass =
  'h-10 min-h-10 w-full rounded-lg border border-line bg-surface px-3 text-base font-body';

/** Multi-line Personal / expand notes — same border+surface, not fixed h-10. */
export const sheetTextAreaClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-base font-body';

export const sheetFieldLabelClass =
  'mb-1 block text-[11.5px] font-emphasis leading-none text-muted';

/** Hop note composer well on Confirm / Dispatch / Settle. */
export const SHEET_COMPOSER_SHELL_CLASS =
  'rounded-2xl border border-line bg-surface';
