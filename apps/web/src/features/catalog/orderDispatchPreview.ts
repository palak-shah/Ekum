import { catalogRateUnit } from '@ekum/domain-types';
import { DEFAULT_RATE_UNIT } from './publishDefaults';

const ORDER_NOUN: Record<string, { one: string; many: string }> = {
  pc: { one: 'pc', many: 'pcs' },
  set: { one: 'set', many: 'sets' },
  mtr: { one: 'mtr', many: 'mtrs' },
  than: { one: 'than', many: 'thans' },
  dozen: { one: 'dozen', many: 'dozen' },
  kg: { one: 'kg', many: 'kg' },
  box: { one: 'box', many: 'boxes' },
  bundle: { one: 'bundle', many: 'bundles' },
};

export function unitCountNoun(unit: string | null | undefined, count: number): string {
  const key = unit?.trim() || 'pc';
  const pair = ORDER_NOUN[key] ?? { one: key, many: `${key}s` };
  return count === 1 ? pair.one : pair.many;
}

/** Unit “1 set contains” / preview conversion uses (rate unit — usually pc). */
export function orderContentsUnit(
  orderUnit: string,
  dispatchUnit: string,
  offeredRateUnits?: readonly string[],
  catalogRateUnitStored?: string | null,
): string {
  return (
    catalogRateUnit({
      unit: orderUnit,
      dispatchUnit,
      catalogRateUnit: catalogRateUnitStored,
      offeredRateUnits,
    }) ??
    (dispatchUnit.trim() || DEFAULT_RATE_UNIT)
  );
}

/** Empty or 0 is unset (clears stored pack). Positive integers only. */
export function parsePiecesPerPack(
  raw: string | number | null | undefined,
): number | null {
  if (raw == null) return null;
  const n = typeof raw === 'string' ? (raw.trim() ? Number(raw.trim()) : NaN) : raw;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/** Editor field: 0 / blank → empty (not given). */
export function piecesPerPackFieldValue(
  raw: string | number | null | undefined,
): string {
  const n = parsePiecesPerPack(raw);
  return n == null ? '' : String(n);
}

/** Live suffix beside the contains number: empty → `pc`; `1` → `pc`; `4` → `pcs`. */
export function setContainsUnitLabel(
  pieces: string,
  contentsUnit: string,
): string {
  const n = Number(pieces.trim());
  if (Number.isFinite(n) && n > 0) return unitCountNoun(contentsUnit, n);
  return contentsUnit;
}

/** `10 sets (= 40 pcs)` when pack size is known. */
export function orderDispatchPreview(
  orderUnit: string,
  piecesPerPack: string | number | null | undefined,
  dispatchUnit: string,
  sampleQty = 10,
  contentsUnitStored?: string,
): string {
  const pack = parsePiecesPerPack(piecesPerPack);
  const orderNoun = unitCountNoun(orderUnit, sampleQty);
  if (pack == null) {
    return `${sampleQty} ${orderNoun}`;
  }
  const contentsUnit =
    contentsUnitStored?.trim() || orderContentsUnit(orderUnit, dispatchUnit);
  const dispatchQty = sampleQty * pack;
  return `${sampleQty} ${orderNoun} (= ${dispatchQty} ${unitCountNoun(contentsUnit, dispatchQty)})`;
}

/** Collapsed accordion summary — order · contains in Rate per · dispatch (if different) · MOQ. */
export function orderDispatchSectionSummary(input: {
  orderUnit: string;
  piecesPerPack: string;
  dispatchUnit: string;
  moq: string;
  contentsUnit?: string;
}): string {
  const unit = input.orderUnit.trim() || 'set';
  const parts = [unit];
  const n = parsePiecesPerPack(input.piecesPerPack);
  const dispatch = input.dispatchUnit.trim() || unit;
  const contents =
    input.contentsUnit?.trim() || orderContentsUnit(unit, dispatch);
  if (n != null) {
    parts.push(`${n} ${unitCountNoun(contents, n)}`);
  }
  if (dispatch && dispatch !== unit) parts.push(`dispatch ${dispatch}`);
  const moq = input.moq.trim();
  if (moq) parts.push(`MOQ ${moq}`);
  return parts.join(' · ');
}
