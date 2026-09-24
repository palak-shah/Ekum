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

