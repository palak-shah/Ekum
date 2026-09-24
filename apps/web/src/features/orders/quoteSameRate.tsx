import { SameForAllEditor, sameForAllChipClassName, sameForAllRateChipLabel } from '@/features/orders/QtyStepper';
import { TextInput } from '@/ui/kit';

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
}: {
  show: boolean;
  open: boolean;
  draft: string;
  applied: string;
  onOpen: () => void;
  onDraftChange: (next: string) => void;
  onApply: () => void;
  onCancel: () => void;
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
          aria-label="Same rate for all designs"
          onChange={(event) => onDraftChange(sanitizeQuoteRateInput(event.target.value))}
        />
      </SameForAllEditor>
    );
  }
  return (
    <button
      type="button"
      data-testid="same-for-all-chip"
      className={sameForAllChipClassName}
      onClick={onOpen}
    >
      {sameForAllRateChipLabel(applied)}
    </button>
  );
}
