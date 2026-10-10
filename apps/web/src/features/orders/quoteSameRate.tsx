import {
  SameForAllEditor,
  sameForAllChipClassName,
  sameForAllRateChipLabel,
  sameQtyRateForAllChipLabel,
} from '@/features/orders/QtyStepper';
import { TextInput } from '@/ui/kit';
import {
  COMPACT_SHEET_NUM_INPUT_CLASS,
  COMPACT_SHEET_RATE_INPUT_CLASS,
} from '@/ui/mobileOverflow';

/** Apply one wholesale rate to every line; blank shared rate restores defaults. */
export function ratesWithSharedValue(
  lineIds: string[],
  sharedRate: string,
  defaults: Record<string, string> = {},
): Record<string, string> {
  const next: Record<string, string> = {};
  const useDefault = !sharedRate.trim();
  for (const id of lineIds) {
    next[id] = useDefault ? (defaults[id] ?? '') : sharedRate;
  }
  return next;
}

/** Valid shared qty draft (≥1). Empty / invalid → null (skip on Apply). */
export function parseSharedQtyDraft(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

/** Digits only — hyphen/range is catalog, not a quote. */
export function sanitizeQuoteRateInput(raw: string): string {
  const cut = raw.split(/[–-]/)[0] ?? '';
  return cut.replace(/[^\d.]/g, '');
}

function parseQuoteRate(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '');
  if (!cleaned || /[–-]/.test(raw)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Canonical fill string. Empty / 0 / range → null. */
export function parseQuoteRateDraft(raw: string): string | null {
  const n = parseQuoteRate(raw);
  return n == null ? null : String(n);
}

export function quoteRateNumber(raw: string | undefined): number | null {
  return parseQuoteRate(raw ?? '');
}

export function SameRateForAll({
  show,
  open,
  draft,
  applied,
  onOpen,
  onDraftChange,
  onApply,
  onCancel,
  chipLabel,
  testId = 'same-for-all-chip',
  ariaLabel = 'Same rate for all designs',
}: {
  show: boolean;
  open: boolean;
  draft: string;
  applied: string;
  onOpen: () => void;
  onDraftChange: (next: string) => void;
  onApply: () => void;
  onCancel: () => void;
  chipLabel?: string;
  testId?: string;
  ariaLabel?: string;
}) {
  if (!show) return null;
  if (open) {
    return (
      <SameForAllEditor onApply={onApply} onCancel={onCancel}>
        <TextInput
          autoFocus
          inputMode="decimal"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder=""
          className="h-10 min-h-10 w-[7.5rem] shrink-0 px-2.5 text-center text-base font-bold tabular-nums"
          value={draft}
          aria-label={ariaLabel}
          onChange={(event) => onDraftChange(sanitizeQuoteRateInput(event.target.value))}
        />
      </SameForAllEditor>
    );
  }
  return (
    <button
      type="button"
      data-testid={testId}
      className={sameForAllChipClassName}
      onClick={onOpen}
    >
      {chipLabel ?? sameForAllRateChipLabel(applied)}
    </button>
  );
}

function SameQtyRateFields({
  qtyDraft,
  rateDraft,
  onQtyDraftChange,
  onRateDraftChange,
  inputClassQty,
  inputClassRate,
}: {
  qtyDraft: string;
  rateDraft: string;
  onQtyDraftChange: (next: string) => void;
  onRateDraftChange: (next: string) => void;
  inputClassQty: string;
  inputClassRate: string;
}) {
  return (
    <div
      className="flex divide-x divide-line/80"
      data-testid="same-qty-rate-for-all-fields"
    >
      <div className="min-w-0 flex-1 pr-2">
        <label
          htmlFor="same-for-all-qty"
          className="text-[10px] font-medium uppercase tracking-wide text-muted"
        >
          Qty
        </label>
        <TextInput
          id="same-for-all-qty"
          autoFocus
          type="number"
          min={1}
          inputMode="numeric"
          className={inputClassQty}
          value={qtyDraft}
          aria-label="Same quantity for all designs"
          data-testid="same-qty-for-all-input"
          onChange={(event) =>
            onQtyDraftChange(event.target.value.replace(/[^\d]/g, ''))
          }
        />
      </div>
      <div className="min-w-0 flex-[1.4] pl-2">
        <label
          htmlFor="same-for-all-rate"
          className="text-[10px] font-medium uppercase tracking-wide text-muted"
        >
          Rate
        </label>
        <TextInput
          id="same-for-all-rate"
          inputMode="decimal"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={inputClassRate}
          value={rateDraft}
          aria-label="Same rate for all designs"
          data-testid="same-rate-for-all-input"
          onChange={(event) =>
            onRateDraftChange(sanitizeQuoteRateInput(event.target.value))
          }
        />
      </div>
    </div>
  );
}

/**
 * One chip → Qty | Rate editor. Apply fills only what is valid.
 * `alignWith="decideRows"`: same tick · thumb · fields columns as Confirm lines
 * so Qty sits above Qty and Rate above Rate. Title + Apply stay in the name column.
 */
export function SameQtyRateForAll({
  show,
  open,
  qtyDraft,
  rateDraft,
  appliedQty,
  appliedRate,
  onOpen,
  onQtyDraftChange,
  onRateDraftChange,
  onApply,
  onCancel,
  alignWith,
}: {
  show: boolean;
  open: boolean;
  qtyDraft: string;
  rateDraft: string;
  appliedQty: number | null;
  appliedRate: string;
  onOpen: () => void;
  onQtyDraftChange: (next: string) => void;
  onRateDraftChange: (next: string) => void;
  onApply: () => void;
  onCancel: () => void;
  alignWith?: 'decideRows';
}) {
  if (!show) return null;
  const canApply =
    parseSharedQtyDraft(qtyDraft) != null || parseQuoteRateDraft(rateDraft) != null;

  const fields = (
    <SameQtyRateFields
      qtyDraft={qtyDraft}
      rateDraft={rateDraft}
      onQtyDraftChange={onQtyDraftChange}
      onRateDraftChange={onRateDraftChange}
      inputClassQty={COMPACT_SHEET_NUM_INPUT_CLASS}
      inputClassRate={COMPACT_SHEET_RATE_INPUT_CLASS}
    />
  );
  const actions = (
    <div className="flex items-center justify-end gap-3">
      <button
        type="submit"
        disabled={!canApply}
        className="text-[13px] font-bold text-accent disabled:opacity-45"
      >
        Apply
      </button>
      <button
        type="button"
        className="text-[13px] font-bold text-muted"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );

  if (open && alignWith === 'decideRows') {
    return (
      <form
        data-testid="same-for-all-editor"
        data-align="decide-rows"
        className="rounded-xl border border-line bg-foam/80 px-2 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canApply) return;
          onApply();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          }
        }}
      >
        {/*
          One wider tile spans tick + gap + thumb (5.75rem) so “Same for all”
          reads larger; gap-2.5 then Qty|Rate matches the decide-row name column.
        */}
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-16 w-[5.75rem] min-h-16 shrink-0 items-center justify-center rounded-xl bg-foam px-1.5 text-center text-xs font-semibold leading-snug text-muted"
            data-testid="same-for-all-thumb"
          >
            Same for all
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {fields}
            {actions}
          </div>
        </div>
      </form>
    );
  }

  if (open) {
    return (
      <form
        data-testid="same-for-all-editor"
        className="flex flex-col gap-2 rounded-xl border border-line bg-foam/80 px-2.5 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canApply) return;
          onApply();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          }
        }}
      >
        <span className="text-[12px] font-semibold text-ink">Same for all</span>
        {fields}
        {actions}
      </form>
    );
  }
  return (
    <button
      type="button"
      data-testid="same-for-all-chip"
      className={sameForAllChipClassName}
      onClick={onOpen}
    >
      {sameQtyRateForAllChipLabel(appliedQty, appliedRate)}
    </button>
  );
}
