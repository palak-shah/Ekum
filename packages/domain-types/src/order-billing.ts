/** Order units that sell as a pack (qty in sets/dozens…; rate on dispatch). */
export function isPackOrderUnit(unit: string | null | undefined): boolean {
  const key = unit?.trim();
  return key === 'set' || key === 'dozen' || key === 'box' || key === 'bundle';
}

/**
 * Dispatch units inside one order unit.
 * Uses `piecesPerPack` when set; obvious exchanges stay (dozen = 12).
 * Set/box/bundle with blank pack size → null (do not invent).
 */
export function packSizeForUnit(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
): number | null {
  if (piecesPerPack != null && piecesPerPack > 0) return piecesPerPack;
  if (unit?.trim() === 'dozen') return 12;
  return null;
}

/** Total dispatch units for a line qty, or null when pack size unknown. */
export function lineDispatchQty(
  qty: number,
  unit: string | null | undefined,
  piecesPerPack?: number | null,
): number | null {
  if (!Number.isFinite(qty) || qty <= 0) return null;
  if (!isPackOrderUnit(unit)) return qty;
  const pack = packSizeForUnit(unit, piecesPerPack);
  if (pack == null) return null;
  return qty * pack;
}

/**
 * Line ₹ amount.
 * Pack path: rate × qty × packSize when known/obvious; else null.
 * Native path: rate × qty.
 */
export function lineBillAmount(input: {
  quantity: number;
  rate: number | null | undefined;
  unit?: string | null;
  piecesPerPack?: number | null;
}): number | null {
  const { quantity, rate, unit, piecesPerPack } = input;
  if (rate == null || !Number.isFinite(rate) || rate < 0) return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (isPackOrderUnit(unit)) {
    const dispatchQty = lineDispatchQty(quantity, unit, piecesPerPack);
    if (dispatchQty == null) return null;
    return Math.round(rate * dispatchQty * 100) / 100;
  }
  return Math.round(rate * quantity * 100) / 100;
}

/**
 * Order/quote total when every priced line is billable.
 * Missing rate on a line → null (cannot total).
 * Pack line with blank (non-obvious) pack size → null.
 */
export function orderBillTotal(
  items: Array<{
    quantity: number;
    rate?: number | null;
    unit?: string | null;
    piecesPerPack?: number | null;
  }>,
): number | null {
  if (items.length === 0) return null;
  let total = 0;
  for (const item of items) {
    if (item.rate == null || !Number.isFinite(item.rate)) return null;
    const amount = lineBillAmount({
      quantity: item.quantity,
      rate: item.rate,
      unit: item.unit,
      piecesPerPack: item.piecesPerPack,
    });
    if (amount == null) return null;
    total += amount;
  }
  return Math.round(total * 100) / 100;
}

/**
 * Default Rate per / dispatch unit among offered options.
 * Prefer pc when offered; otherwise first offered (e.g. mtr for fabric).
 */
export function defaultRateUnit(offered: readonly string[]): string {
  const clean = offered.map((u) => u.trim()).filter(Boolean);
  if (clean.includes('pc')) return 'pc';
  return clean[0] || 'pc';
}

/** Rate display unit: dispatch on pack path; order unit on native. */
export function catalogRateUnit(input: {
  unit?: string | null;
  dispatchUnit?: string | null;
  offeredRateUnits?: readonly string[];
}): string | null {
  if (isPackOrderUnit(input.unit)) {
    const d = input.dispatchUnit?.trim();
    if (d) return d;
    return defaultRateUnit(input.offeredRateUnits ?? ['pc']);
  }
  return input.unit?.trim() || null;
}
