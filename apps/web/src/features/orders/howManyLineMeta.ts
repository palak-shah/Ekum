import { formatCatalogRate, isPackOrderUnit } from '@/lib/catalogRate';
import { packSizeForUnit } from '@ekum/domain-types';
import { unitCountNoun } from '@/features/catalog/orderDispatchPreview';
import { lineBillAmount, orderBillTotal } from '@/features/orders/orderLineBilling';

const SOLD_AS: Record<string, string> = {
  pc: 'Piece',
  set: 'Set',
  mtr: 'Metre',
  than: 'Than',
  dozen: 'Dozen',
  kg: 'Kg',
  box: 'Box',
  bundle: 'Bundle',
};

function dispatchContentsLabel(
  pack: number,
  dispatchUnit?: string | null,
): string {
  const dispatch = dispatchUnit?.trim() || 'pc';
  return `${pack} ${unitCountNoun(dispatch, pack)}`;
}

/** Short sold-as on the name line — never a second title under a one-word name. */
export function howManyUnitShort(unit: string | null | undefined): string | null {
  const key = unit?.trim();
  if (!key) return null;
  return SOLD_AS[key] ?? key;
}

/** Min / rate / contents-in-set — not the sold-as word (that sits beside the name). */
export function howManyLineExtra(product: {
  unit?: string | null;
  dispatchUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
}): string | null {
  const bits: string[] = [];
  const pack = packSizeForUnit(product.unit, product.piecesPerPack);
  if (pack != null) bits.push(dispatchContentsLabel(pack, product.dispatchUnit));
  if (product.moq != null && product.moq > 0) bits.push(`min ${product.moq}`);
  const rate = formatCatalogRate(product);
  if (rate !== 'On request') bits.push(rate);
  return bits.length > 0 ? bits.join(' · ') : null;
}

export function howManySoldAs(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
  dispatchUnit?: string | null,
): string | null {
  const key = unit?.trim();
  if (!key) return null;
  const label = SOLD_AS[key] ?? key;
  const pack = packSizeForUnit(unit, piecesPerPack);
  if (pack != null) {
    return `${label} · ${dispatchContentsLabel(pack, dispatchUnit)}`;
  }
  return label;
}

/** How they sell (set / dozen / metre), min, and rate — not catalog tags. */
export function howManyLineMeta(product: {
  unit?: string | null;
  dispatchUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
}): string | null {
  const bits: string[] = [];
  const sold = howManySoldAs(product.unit, product.piecesPerPack, product.dispatchUnit);
  if (sold) bits.push(sold);
  if (product.moq != null && product.moq > 0) bits.push(`min ${product.moq}`);
  const rate = formatCatalogRate(product);
  if (rate !== 'On request') bits.push(rate);
  return bits.length > 0 ? bits.join(' · ') : null;
}

/** Dispatch units inside one sell-as unit (set / dozen / box). Dozen = 12 stays. */
export function howManyPcsPerUnit(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
): number | null {
  return packSizeForUnit(unit, piecesPerPack);
}

/** Quiet line when pack unit has no contents. */
export function howManySetContentsMissing(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
): string | null {
  if (!isPackOrderUnit(unit)) return null;
  if (howManyPcsPerUnit(unit, piecesPerPack) != null) return null;
  return 'Set contents not mentioned';
}

/** 5 sets × 4 → Total 20 pcs/mtrs. Hidden without a count or pack size. */
export function howManyTotalPcsLabel(
  qty: number | null | undefined,
  unit: string | null | undefined,
  piecesPerPack?: number | null,
  dispatchUnit?: string | null,
): string | null {
  if (qty == null || qty <= 0) return null;
  if (!isPackOrderUnit(unit)) return null;
  const pcs = howManyPcsPerUnit(unit, piecesPerPack);
  if (pcs == null) return null;
  const dispatch = dispatchUnit?.trim() || 'pc';
  return `Total ${qty * pcs} ${unitCountNoun(dispatch, qty * pcs)}`;
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
    case 'bundle':
      return 'bundles';
    default:
      return 'pieces';
  }
}

/** Visible stepper caption — Capitalized unit noun. */
export function qtyStepperUnitLabel(unit: string | null | undefined): string {
  const noun = qtyCountNoun(unit);
  return noun.charAt(0).toUpperCase() + noun.slice(1);
}

export type HowManyQtyLine = {
  quantity: number | null;
  unit?: string | null;
  piecesPerPack?: number | null;
  dispatchUnit?: string | null;
  rate?: number | null;
};

/** Sheet banner when any line is a pack unit. */
export function howManySetsBanner(
  products: Array<{ unit?: string | null; dispatchUnit?: string | null }>,
): string | null {
  const pack = products.filter((p) => isPackOrderUnit(p.unit));
  if (pack.length === 0) return null;
  const allPc = pack.every((p) => (p.dispatchUnit?.trim() || 'pc') === 'pc');
  const allSets = pack.every((p) => p.unit?.trim() === 'set');
  if (allPc && allSets) {
    return 'You order in sets. Rates and dispatch are per pc.';
  }
  if (allPc) {
    return 'You order in packs. Rates and dispatch are per pc.';
  }
  return 'You order in packs. Rates follow the dispatch unit.';
}

/**
 * Footer: `2 sets = 12 pcs` when contents known; else `2 sets`.
 * Optional money when every line with qty+rate is billable.
 * Native-only sheet: `2 pcs` / metres.
 */
export function howManyOrderFooterSummary(lines: HowManyQtyLine[]): {
  primary: string;
  hint?: string;
  money?: string;
} | null {
  const withQty = lines.filter((l) => l.quantity != null && l.quantity > 0);
  if (withQty.length === 0) return null;

  const moneyTotal = (() => {
    const priced = withQty.filter((l) => l.rate != null);
    if (priced.length === 0) return null;
    if (priced.length !== withQty.length) return null;
    const total = orderBillTotal(
      priced.map((l) => ({
        quantity: l.quantity!,
        rate: l.rate,
        unit: l.unit,
        piecesPerPack: l.piecesPerPack,
      })),
    );
    if (total == null) return null;
    return `₹${total.toLocaleString('en-IN')}`;
  })();

  const packLines = withQty.filter((l) => isPackOrderUnit(l.unit));
  if (packLines.length > 0) {
    const total = packLines.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
    const noun =
      packLines.every((l) => l.unit?.trim() === 'set')
        ? 'sets'
        : packLines.every((l) => l.unit?.trim() === 'dozen')
          ? 'dozens'
          : 'packs';
    const allKnown = packLines.every(
      (l) => howManyPcsPerUnit(l.unit, l.piecesPerPack) != null,
    );
    if (allKnown) {
      const totalPcs = packLines.reduce(
        (sum, l) =>
          sum + (l.quantity ?? 0) * (howManyPcsPerUnit(l.unit, l.piecesPerPack) ?? 0),
        0,
      );
      const dispatch = packLines[0]?.dispatchUnit?.trim() || 'pc';
      const dNoun = unitCountNoun(dispatch, totalPcs);
      return {
        primary: `${total} ${noun} = ${totalPcs} ${dNoun}`,
        money: moneyTotal ?? undefined,
      };
    }
    return {
      primary: `${total} ${noun}`,
      hint: 'No piece total — set contents not mentioned on some designs.',
      money: moneyTotal ?? undefined,
    };
  }

  const unit = withQty[0]?.unit?.trim() || 'pc';
  const sameUnit = withQty.every((l) => (l.unit?.trim() || 'pc') === unit);
  if (!sameUnit) return null;
  const total = withQty.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
  return {
    primary: `${total} ${qtyCountNoun(unit)}`,
    money: moneyTotal ?? undefined,
  };
}

/** Bill amount for How many money when a single line is fully known. */
export function howManyLineBillAmount(line: HowManyQtyLine): number | null {
  if (line.quantity == null || line.quantity <= 0) return null;
  return lineBillAmount({
    quantity: line.quantity,
    rate: line.rate,
    unit: line.unit,
    piecesPerPack: line.piecesPerPack,
  });
}
