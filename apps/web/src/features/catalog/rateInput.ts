/** Parse / display catalog rates that may be a single number or a range. */

export type ParsedRate = {
  rate: number | null;
  rateMax: number | null;
};

export type SameForAllDetails = {
  categories: string[];
  rate: string;
  unit: string;
  /** Pieces in one set / dozen / box — empty when unset. */
  piecesPerPack: string;
  moq: string;
  notes: string;
};

/**
 * Phone `decimal` keypads omit `-`, so ranges like 1200-1400 cannot be typed.
 * Use text mode on every rate field that accepts a range.
 */
export const rateFieldInputProps = {
  placeholder: '1200 or 1200-1400',
  inputMode: 'text' as const,
  autoCapitalize: 'off' as const,
  autoCorrect: 'off' as const,
  spellCheck: false as const,
};

function parseOneNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Accepts `1200`, `1,200`, `1200-1400`, `1200–1400`. Invalid → both null. */
export function parseRateInput(raw: string): ParsedRate {
  const text = raw.trim();
  if (!text) return { rate: null, rateMax: null };

  const rangeParts = text.split(/\s*[–-]\s*/);
  if (rangeParts.length === 2) {
    const low = parseOneNumber(rangeParts[0] ?? '');
    const high = parseOneNumber(rangeParts[1] ?? '');
    if (low == null || high == null || high < low) {
      return { rate: null, rateMax: null };
    }
    if (high === low) return { rate: low, rateMax: null };
    return { rate: low, rateMax: high };
  }

  const rate = parseOneNumber(text);
  return { rate, rateMax: null };
}

export function formatRateInput(rate: number | null, rateMax: number | null): string {
  if (rate == null) return '';
  if (rateMax != null && rateMax > rate) return `${rate}-${rateMax}`;
  return String(rate);
}

/** One-line summary for the Same for all row; null when empty (dashed skippable). */
export function sameForAllSummary(details: SameForAllDetails): string | null {
  const parts: string[] = [];
  const rate = details.rate.trim();
  if (rate) parts.push(rate);
  if (details.unit.trim()) parts.push(details.unit.trim());
  if (details.piecesPerPack.trim()) parts.push(`${details.piecesPerPack.trim()} pcs`);
  if (details.moq.trim()) parts.push(`MOQ ${details.moq.trim()}`);
  if (details.notes.trim()) parts.push(details.notes.trim());
  if (details.categories.length === 1) parts.push(details.categories[0]);
  else if (details.categories.length > 1) {
    parts.push(`${details.categories[0]} +${details.categories.length - 1}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function sameForAllIsEmpty(details: SameForAllDetails): boolean {
  return sameForAllSummary(details) == null;
}
