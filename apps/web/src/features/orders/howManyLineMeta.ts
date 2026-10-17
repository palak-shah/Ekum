import { formatCatalogRate, isPackOrderUnit } from '@/lib/catalogRate';
import { catalogRateUnit, packSizeForUnit } from '@ekum/domain-types';
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
  unit?: string | null,
  dispatchUnit?: string | null,
): string {
  const contents =
    catalogRateUnit({ unit, dispatchUnit }) ?? dispatchUnit?.trim() ?? 'pc';
  return `${pack} ${unitCountNoun(contents, pack)}`;
}

/** Short sold-as on the name line — never a second title under a one-word name. */
export function howManyUnitShort(unit: string | null | undefined): string | null {
  const key = unit?.trim();
  if (!key) return null;
  return SOLD_AS[key] ?? key;
}

function inr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Quiet money under the name.
 * Pack path: price of one order unit (rate × pack) — no “1 pc” and no “/pc”.
 * Native path: catalog rate with its unit.
 */
export function howManyLineExtra(product: {
  unit?: string | null;
  dispatchUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
}): string | null {
  const bits: string[] = [];
  if (isPackOrderUnit(product.unit)) {
    const pack = packSizeForUnit(product.unit, product.piecesPerPack);
    if (pack != null && product.rate != null) {
      const low = product.rate * pack;
      const high =
        product.rateMax != null && product.rateMax > product.rate
          ? product.rateMax * pack
          : null;
      bits.push(high != null ? `${inr(low)}–${inr(high)}` : inr(low));
    }
  } else {
    const rate = formatCatalogRate(product);
    if (rate !== 'On request') bits.push(rate);
  }
  if (product.moq != null && product.moq > 0) bits.push(`min ${product.moq}`);
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
    return `${label} · ${dispatchContentsLabel(pack, unit, dispatchUnit)}`;
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

/** One set’s contents, e.g. `20 pcs`. Null when pack size is blank. */
export function howManyPackContentsLabel(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
  dispatchUnit?: string | null,
): string | null {
  const pack = packSizeForUnit(unit, piecesPerPack);
  if (pack == null) return null;
  const contents =
    catalogRateUnit({ unit, dispatchUnit }) ?? dispatchUnit?.trim() ?? 'pc';
  return `${pack} ${unitCountNoun(contents, pack)}`;
}

/**
 * True when pack lines on this sheet do not all share one known size
 * (20 pcs next to 4 pcs, or some sizes missing).
 */
export function howManyPackSizesDiffer(
  products: Array<{
    unit?: string | null;
    piecesPerPack?: number | null;
  }>,
): boolean {
  const packs = products
    .filter((p) => isPackOrderUnit(p.unit))
    .map((p) => packSizeForUnit(p.unit, p.piecesPerPack));
  if (packs.length < 2) return false;
  const known = packs.filter((p): p is number => p != null);
  if (known.length !== packs.length) return known.length > 0;
  return new Set(known).size > 1;
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

function qtyPhrase(qty: number, unit: string | null | undefined): string {
  if (qty === 1) {
    const one = (howManyUnitShort(unit) ?? 'set').toLowerCase();
    return `1 ${one}`;
  }
  return `${qty} ${qtyCountNoun(unit)}`;
}

/** Under the stepper: `Total 30 sets = 30 pcs`. Hidden without qty or pack size. */
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
  const contents =
    catalogRateUnit({ unit, dispatchUnit }) ?? dispatchUnit?.trim() ?? 'pc';
  const total = qty * pcs;
  return `Total ${qtyPhrase(qty, unit)} = ${total} ${unitCountNoun(contents, total)}`;
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

/**
 * Journey dispatch for the banner.
 * Order + dispatch both set (or legacy dispatch `pc`) → dispatch is the order unit;
 * rate stays pc via catalogRateUnit.
 */
function bannerJourney(
  unit: string | null | undefined,
  dispatchUnit: string | null | undefined,
): { order: string; dispatch: string; rate: string } {
  const order = unit?.trim() || 'set';
  const stored = dispatchUnit?.trim() || '';
  const dispatch =
    !stored || stored === order || (isPackOrderUnit(order) && stored === 'pc')
      ? order
      : stored;
  const rate = catalogRateUnit({ unit: order, dispatchUnit: stored || order }) ?? 'pc';
  return { order, dispatch, rate };
}

/** Quiet line: default “Rates are per pc. Order and dispatch per set.” Follows each design’s units. */
export function howManySetsBanner(
  products: Array<{ unit?: string | null; dispatchUnit?: string | null }>,
): string | null {
  const pack = products.filter((p) => isPackOrderUnit(p.unit));
  if (pack.length === 0) return null;
  const rows = pack.map((p) => bannerJourney(p.unit, p.dispatchUnit));
  const first = rows[0]!;
  const same = rows.every(
    (r) => r.order === first.order && r.dispatch === first.dispatch && r.rate === first.rate,
  );
  if (!same) return 'Rates, order, and dispatch differ by design.';
  if (first.order === first.dispatch) {
    return `Rates are per ${first.rate}. Order and dispatch per ${first.order}.`;
  }
  return `Rates are per ${first.rate}. Order per ${first.order}. Dispatch per ${first.dispatch}.`;
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
    const packs = packLines.map((l) => howManyPcsPerUnit(l.unit, l.piecesPerPack));
    const allKnown = packs.every((p) => p != null);
    // Unknown pcs-per-set: sets only — they settle contents in chat. No "= n pcs".
    if (!allKnown) {
      return {
        primary: `${total} ${noun}`,
        money: moneyTotal ?? undefined,
      };
    }
    const totalPcs = packLines.reduce(
      (sum, l) => sum + (l.quantity ?? 0) * (howManyPcsPerUnit(l.unit, l.piecesPerPack) ?? 0),
      0,
    );
    const contents =
      catalogRateUnit({
        unit: packLines[0]?.unit,
        dispatchUnit: packLines[0]?.dispatchUnit,
      }) ?? 'pc';
    const dNoun = unitCountNoun(contents, totalPcs);
    return {
      primary: `${total} ${noun} = ${totalPcs} ${dNoun}`,
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
