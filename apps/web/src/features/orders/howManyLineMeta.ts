import { formatRate } from '@/lib/format';

const SOLD_AS: Record<string, string> = {
  pc: 'Piece',
  set: 'Set',
  mtr: 'Metre',
  than: 'Than',
  dozen: 'Dozen',
  kg: 'Kg',
  box: 'Box',
};

/** Short sold-as on the name line — never a second title under a one-word name. */
export function howManyUnitShort(unit: string | null | undefined): string | null {
  const key = unit?.trim();
  if (!key) return null;
  return SOLD_AS[key] ?? key;
}

/** Min / rate / pcs-in-set — not the sold-as word (that sits beside the name). */
export function howManyLineExtra(product: {
  unit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
}): string | null {
  const bits: string[] = [];
  const key = product.unit?.trim();
  const pack = product.piecesPerPack;
  if (pack != null && pack > 0) bits.push(`${pack} pcs`);
  else if (key === 'dozen') bits.push('12 pcs');
  if (product.moq != null && product.moq > 0) bits.push(`min ${product.moq}`);
  const rate = formatRate(product.rate ?? null, product.unit ?? null, product.rateMax ?? null);
  if (rate !== 'On request') bits.push(rate);
  return bits.length > 0 ? bits.join(' · ') : null;
}

export function howManySoldAs(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
): string | null {
  const key = unit?.trim();
  if (!key) return null;
  const label = SOLD_AS[key] ?? key;
  if (piecesPerPack != null && piecesPerPack > 0) {
    if (key === 'dozen' && piecesPerPack === 12) return 'Dozen · 12 pcs';
    return `${label} · ${piecesPerPack} pcs`;
  }
  if (key === 'dozen') return 'Dozen · 12 pcs';
  return label;
}

/** How they sell (set / dozen / metre), min, and rate — not catalog tags. */
export function howManyLineMeta(product: {
  unit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
}): string | null {
  const bits: string[] = [];
  const sold = howManySoldAs(product.unit, product.piecesPerPack);
  if (sold) bits.push(sold);
  if (product.moq != null && product.moq > 0) bits.push(`min ${product.moq}`);
  const rate = formatRate(product.rate ?? null, product.unit ?? null, product.rateMax ?? null);
  if (rate !== 'On request') bits.push(rate);
  return bits.length > 0 ? bits.join(' · ') : null;
}

/** Pcs inside one sell-as unit (set / dozen / box). */
export function howManyPcsPerUnit(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
): number | null {
  if (piecesPerPack != null && piecesPerPack > 0) return piecesPerPack;
  if (unit === 'dozen') return 12;
  return null;
}

/** 5 sets × 4 pcs → Total 20 pcs. Hidden without a count or pcs-per-unit. */
export function howManyTotalPcsLabel(
  qty: number | null | undefined,
  unit: string | null | undefined,
  piecesPerPack?: number | null,
): string | null {
  if (qty == null || qty <= 0) return null;
  const key = unit?.trim();
  if (key !== 'set' && key !== 'dozen' && key !== 'box') return null;
  const pcs = howManyPcsPerUnit(unit, piecesPerPack);
  if (pcs == null) return null;
  return `Total ${qty * pcs} pcs`;
}

export function qtyCountNoun(unit: string | null | undefined): string {
  switch (unit?.trim()) {
    case 'set':
      return 'sets';
    case 'dozen':
      return 'dozens';
    case 'mtr':
      return 'metres';
    case 'than':
      return 'thans';
    case 'kg':
      return 'kg';
    case 'box':
      return 'boxes';
    default:
      return 'pieces';
  }
}

