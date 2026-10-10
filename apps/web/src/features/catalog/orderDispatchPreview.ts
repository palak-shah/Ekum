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

/** `10 sets (= 40 pcs)` when pack size is known. */
export function orderDispatchPreview(
  orderUnit: string,
  piecesPerPack: string | number | null | undefined,
  dispatchUnit: string,
  sampleQty = 10,
): string {
  const pack = typeof piecesPerPack === 'string' ? Number(piecesPerPack) : piecesPerPack;
  const orderNoun = unitCountNoun(orderUnit, sampleQty);
  if (pack == null || !Number.isFinite(pack) || pack <= 0) {
    return `${sampleQty} ${orderNoun}`;
  }
  const dispatchQty = sampleQty * pack;
  return `${sampleQty} ${orderNoun} (= ${dispatchQty} ${unitCountNoun(dispatchUnit, dispatchQty)})`;
}

/** Collapsed accordion summary — unit · contains · dispatch · MOQ. */
export function orderDispatchSectionSummary(input: {
  orderUnit: string;
  piecesPerPack: string;
  dispatchUnit: string;
  moq: string;
}): string {
  const unit = input.orderUnit.trim() || 'pc';
  const parts = [unit];
  const pcs = input.piecesPerPack.trim();
  if (pcs) parts.push(`${pcs} pcs`);
  const dispatch = input.dispatchUnit.trim();
  if (dispatch && dispatch !== unit) parts.push(`dispatch ${dispatch}`);
  const moq = input.moq.trim();
  if (moq) parts.push(`MOQ ${moq}`);
  return parts.join(' · ');
}
