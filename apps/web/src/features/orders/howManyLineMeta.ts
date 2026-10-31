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
  catalogRateUnitStored?: string | null,
): string {
  const contents =
    catalogRateUnit({
      unit,
      dispatchUnit,
      catalogRateUnit: catalogRateUnitStored,
    }) ??
    dispatchUnit?.trim() ??
    'pc';
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
 * Quiet money under the name — always ₹/unit (`formatCatalogRate`).
 * Never rate × pack on the line; conversion lives on Total.
 */
export function howManyLineExtra(product: {
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
}): string | null {
  const bits: string[] = [];
  const rate = formatCatalogRate(product);
  if (rate !== 'On request') bits.push(rate);
  if (product.moq != null && product.moq > 0) bits.push(`min ${product.moq}`);
  return bits.length > 0 ? bits.join(' · ') : null;
}

/** Rate on a line — always ₹/unit. Null when on request. */
export function orderRateText(input: {
  rate?: number | null;
  rateMax?: number | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): string | null {
  const text = formatCatalogRate(input);
  return text === 'On request' ? null : text;
}

export function howManySoldAs(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
  dispatchUnit?: string | null,
  catalogRateUnitStored?: string | null,
): string | null {
  const key = unit?.trim();
  if (!key) return null;
  const label = SOLD_AS[key] ?? key;
  const pack = packSizeForUnit(unit, piecesPerPack);
  if (pack != null) {
    return `${label} · ${dispatchContentsLabel(pack, unit, dispatchUnit, catalogRateUnitStored)}`;
  }
  return label;
}

/** How they sell (set / dozen / metre), min, and rate — not catalog tags. */
export function howManyLineMeta(product: {
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
}): string | null {
  const bits: string[] = [];
  const sold = howManySoldAs(
    product.unit,
    product.piecesPerPack,
    product.dispatchUnit,
    product.catalogRateUnit,
  );
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
  catalogRateUnitStored?: string | null,
): string | null {
  const pack = packSizeForUnit(unit, piecesPerPack);
  if (pack == null) return null;
  const contents =
    catalogRateUnit({
      unit,
      dispatchUnit,
      catalogRateUnit: catalogRateUnitStored,
    }) ??
    dispatchUnit?.trim() ??
    'pc';
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

/** Quiet line when pack unit has no contents — only if the sheet is mixed. */
export function howManySetContentsMissing(
  unit: string | null | undefined,
  piecesPerPack?: number | null,
  sheetMixedPack?: boolean,
): string | null {
  if (!sheetMixedPack) return null;
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

/** Plural trade short — same vocabulary as rates (`mtrs`, `pcs`, not “metres”). */
export function qtyCountNoun(unit: string | null | undefined): string {
  return unitCountNoun(unit, 2);
}

/** Visible stepper caption — Capitalized unit noun. */
export function qtyStepperUnitLabel(unit: string | null | undefined): string {
  const noun = qtyCountNoun(unit);
  return noun.charAt(0).toUpperCase() + noun.slice(1);
}

export function howManyOrderUnitKey(unit: string | null | undefined): string {
  return unit?.trim() || 'pc';
}

/** Pack units first (set / dozen / box / bundle), then mtr, then pc. */
function howManyUnitGroupRank(unit: string): number {
  if (isPackOrderUnit(unit)) {
    if (unit === 'set') return 0;
    if (unit === 'dozen') return 1;
    if (unit === 'box') return 2;
    if (unit === 'bundle') return 3;
    return 4;
  }
  if (unit === 'mtr') return 10;
  if (unit === 'pc') return 20;
  if (unit === 'than') return 21;
  if (unit === 'kg') return 22;
  return 30;
}

export type HowManyUnitGroup<T> = {
  unit: string;
  label: string;
  items: T[];
};

/** Restack by order unit; pick order stays inside each group. */
export function groupHowManyByOrderUnit<T>(
  items: T[],
  unitOf: (item: T) => string | null | undefined,
): HowManyUnitGroup<T>[] {
  const buckets = new Map<string, T[]>();
  const firstAt = new Map<string, number>();
  items.forEach((item, index) => {
    const unit = howManyOrderUnitKey(unitOf(item));
    if (!firstAt.has(unit)) firstAt.set(unit, index);
    const list = buckets.get(unit) ?? [];
    list.push(item);
    buckets.set(unit, list);
  });
  return [...buckets.keys()]
    .sort((a, b) => {
      const rank = howManyUnitGroupRank(a) - howManyUnitGroupRank(b);
      if (rank !== 0) return rank;
      return (firstAt.get(a) ?? 0) - (firstAt.get(b) ?? 0);
    })
    .map((unit) => ({
      unit,
      label: qtyStepperUnitLabel(unit),
      items: buckets.get(unit) ?? [],
    }));
}

/** Last design in restacked order — Done on the last qty after grouping. */
export function lastGroupedItem<T>(
  items: T[],
  unitOf: (item: T) => string | null | undefined,
): T | undefined {
  const groups = groupHowManyByOrderUnit(items, unitOf);
  return groups.at(-1)?.items.at(-1);
}

export function howManyOrderUnitsMixed(
  items: Array<{ unit?: string | null }>,
): boolean {
  return groupHowManyByOrderUnit(items, (item) => item.unit).length > 1;
}

export type HowManyQtyLine = {
  quantity: number | null;
  unit?: string | null;
  piecesPerPack?: number | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  rate?: number | null;
  lineStatus?: string | null;
};

export type OrderUnitRole = 'ordering' | 'dispatching';

/** `Order in Mtrs` / `Dispatch in Sets`. Always a job header, even one family. */
export function orderUnitSheetHeading(
  unit: string | null | undefined,
  role: OrderUnitRole,
): string {
  const label = qtyStepperUnitLabel(unit);
  return role === 'dispatching' ? `Dispatch in ${label}` : `Order in ${label}`;
}

/** Ticket Designs quiet line: `Order in Sets · rate per mtr`. Mixed units omit the mismatched bit. */
export function ticketDesignsCaption(
  items: Array<{
    unit?: string | null;
    dispatchUnit?: string | null;
    catalogRateUnit?: string | null;
    lineStatus?: string | null;
  }>,
): string {
  const remaining = items.filter((item) => item.lineStatus !== 'declined');
  const source = remaining.length > 0 ? remaining : items;
  const orders = new Set<string>();
  const rates = new Set<string>();
  for (const item of source) {
    const journey = orderLineUnitJourney(item.unit, item.dispatchUnit, item.catalogRateUnit);
    orders.add(journey.order);
    rates.add(journey.rate);
  }
  const orderBit =
    orders.size === 1 ? orderUnitSheetHeading([...orders][0], 'ordering') : null;
  const rateBit = rates.size === 1 ? `rate per ${[...rates][0]}` : null;
  return [orderBit, rateBit].filter(Boolean).join(' · ');
}

/**
 * Journey: order + dispatch both set (or legacy dispatch `pc`) → dispatch is the order unit;
 * rate stays pc via catalogRateUnit.
 */
export function orderLineUnitJourney(
  unit: string | null | undefined,
  dispatchUnit: string | null | undefined,
  catalogRateUnitStored?: string | null,
): { order: string; dispatch: string; rate: string } {
  const order = unit?.trim() || 'set';
  const stored = dispatchUnit?.trim() || '';
  const dispatch =
    !stored || stored === order || (isPackOrderUnit(order) && stored === 'pc')
      ? order
      : stored;
  const rate =
    catalogRateUnit({
      unit: order,
      dispatchUnit: stored || order,
      catalogRateUnit: catalogRateUnitStored,
    }) ?? 'pc';
  return { order, dispatch, rate };
}

/**
 * Convert pack qty on Total only when the group unit’s rate is a different unit.
 * pc/mtr never convert. Same order=dispatch=rate → no `100 sets = 100 sets`.
 */
export function packQtyConversionWanted(line: {
  unit?: string | null;
  piecesPerPack?: number | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
}): boolean {
  if (!isPackOrderUnit(line.unit)) return false;
  if (howManyPcsPerUnit(line.unit, line.piecesPerPack) == null) return false;
  const journey = orderLineUnitJourney(line.unit, line.dispatchUnit, line.catalogRateUnit);
  return !(
    journey.order === journey.dispatch && journey.dispatch === journey.rate
  );
}

/** Quiet line: default “Rates are per pc. Order and dispatch per set.” Follows each design’s units. */
export function howManySetsBanner(
  products: Array<{
    unit?: string | null;
    dispatchUnit?: string | null;
    catalogRateUnit?: string | null;
  }>,
): string | null {
  const pack = products.filter((p) => isPackOrderUnit(p.unit));
  if (pack.length === 0) return null;
  const rows = pack.map((p) =>
    orderLineUnitJourney(p.unit, p.dispatchUnit, p.catalogRateUnit),
  );
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

export type HowManyFooterSummary = {
  rows: string[];
  money?: string;
};

function packContentsUnit(line: HowManyQtyLine): string {
  return (
    catalogRateUnit({
      unit: line.unit,
      dispatchUnit: line.dispatchUnit,
      catalogRateUnit: line.catalogRateUnit,
    }) ??
    line.dispatchUnit?.trim() ??
    'pc'
  );
}

/**
 * Footer: one row per unit family (`2 sets = 12 pcs`, `70 mtrs`).
 * Conversion only for group units when rate unit differs and pack is known.
 * Optional money only when every counted line is billable.
 */
export function howManyOrderFooterSummary(
  lines: HowManyQtyLine[],
  opts?: { packConversion?: boolean },
): HowManyFooterSummary | null {
  const convertPack = opts?.packConversion !== false;
  const withQty = lines.filter((l) => l.quantity != null && l.quantity > 0);
  if (withQty.length === 0) return null;

  const moneyTotal = (() => {
    const priced = withQty.filter((l) => l.rate != null);
    if (priced.length === 0) return undefined;
    if (priced.length !== withQty.length) return undefined;
    const total = orderBillTotal(
      priced.map((l) => ({
        quantity: l.quantity!,
        rate: l.rate,
        unit: l.unit,
        piecesPerPack: l.piecesPerPack,
      })),
    );
    if (total == null) return undefined;
    return `₹${total.toLocaleString('en-IN')}`;
  })();

  const rows: string[] = [];
  const packGroups = new Map<string, HowManyQtyLine[]>();
  const nativeGroups = new Map<string, HowManyQtyLine[]>();

  const packUnitUnknown = new Set<string>();
  for (const line of withQty) {
    if (!isPackOrderUnit(line.unit)) continue;
    if (howManyPcsPerUnit(line.unit, line.piecesPerPack) == null) {
      packUnitUnknown.add(line.unit?.trim() || 'set');
    }
  }

  for (const line of withQty) {
    if (isPackOrderUnit(line.unit)) {
      const orderUnit = line.unit?.trim() || 'set';
      const pack = howManyPcsPerUnit(line.unit, line.piecesPerPack);
      const key =
        pack == null || packUnitUnknown.has(orderUnit)
          ? `${orderUnit}|unknown`
          : `${orderUnit}|${packContentsUnit(line)}`;
      const group = packGroups.get(key) ?? [];
      group.push(line);
      packGroups.set(key, group);
    } else {
      const unit = line.unit?.trim() || 'pc';
      const group = nativeGroups.get(unit) ?? [];
      group.push(line);
      nativeGroups.set(unit, group);
    }
  }

  for (const [key, group] of packGroups) {
    const [orderUnit, contents] = key.split('|') as [string, string];
    const total = group.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
    const noun = unitCountNoun(orderUnit, total);
    const convert =
      convertPack &&
      contents !== 'unknown' &&
      group.every((line) => packQtyConversionWanted(line));
    if (!convert) {
      rows.push(`${total} ${noun}`);
      continue;
    }
    const totalPcs = group.reduce(
      (sum, l) => sum + (l.quantity ?? 0) * (howManyPcsPerUnit(l.unit, l.piecesPerPack) ?? 0),
      0,
    );
    rows.push(`${total} ${noun} = ${totalPcs} ${unitCountNoun(contents, totalPcs)}`);
  }

  for (const [unit, group] of nativeGroups) {
    const total = group.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
    rows.push(`${total} ${unitCountNoun(unit, total)}`);
  }

  if (rows.length === 0) return null;
  return moneyTotal ? { rows, money: moneyTotal } : { rows };
}

export type TicketTotalUnitRow = {
  unit: string;
  qty: string;
  money: string | null;
};

export type TicketTotalSummary = {
  units: TicketTotalUnitRow[];
  /** Mixed: sum of billed families when any ₹ exists. */
  grand: string | null;
  /** Highlight under Total — uncounted remaining lines. */
  missingCue: string | null;
};

function formatTicketMoney(amount: number | null): string | null {
  if (amount == null) return null;
  return inr(amount);
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

function sumBillable(lines: HowManyQtyLine[]): number | null {
  let total = 0;
  let any = false;
  for (const line of lines) {
    const amount = howManyLineBillAmount(line);
    if (amount == null) continue;
    any = true;
    total += amount;
  }
  return any ? Math.round(total * 100) / 100 : null;
}

/** Why this remaining line is in qty but not in ₹. */
export function ticketLineSkipReason(line: HowManyQtyLine): 'rate' | 'pack' | null {
  if (line.quantity == null || line.quantity <= 0) return null;
  if (howManyLineBillAmount(line) != null) return null;
  if (isPackOrderUnit(line.unit) && howManyPcsPerUnit(line.unit, line.piecesPerPack) == null) {
    return 'pack';
  }
  return 'rate';
}

/** One cue: Missing rates and/or No pcs in a set — only under a billed ₹. */
export function ticketTotalMissingCue(lines: HowManyQtyLine[]): string | null {
  let rate = false;
  let packSkip = false;
  let billed = false;
  for (const line of lines) {
    if (line.quantity == null || line.quantity <= 0) continue;
    if (howManyLineBillAmount(line) != null) billed = true;
    const reason = ticketLineSkipReason(line);
    if (reason === 'rate') rate = true;
    if (reason === 'pack') packSkip = true;
  }
  if (!billed) return null;
  /** Uncounted pack lines under a billed Total — including all-blank pack next to billed pcs. */
  const packCue = packSkip;
  if (rate && packCue) return 'Missing rates · no pcs in a set';
  if (rate) return 'Missing rates';
  if (packCue) return 'No pcs in a set';
  return null;
}

function familyPackUnknown(lines: HowManyQtyLine[]): boolean {
  return lines.some(
    (line) =>
      isPackOrderUnit(line.unit) && howManyPcsPerUnit(line.unit, line.piecesPerPack) == null,
  );
}

function familyQtyLabel(lines: HowManyQtyLine[]): string {
  const qty = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
  const unit = lines[0]?.unit;
  if (familyPackUnknown(lines)) {
    return `${qty} ${unitCountNoun(unit, qty)}`;
  }
  return howManyOrderFooterSummary(lines)?.rows[0] ?? `${qty} ${unitCountNoun(unit, qty)}`;
}

/**
 * Ticket mill-bill: qty of remaining lines, ₹ of billable lines.
 * Conversion when every pack line in the family has size. Mixed pack keeps `N sets`
 * and bills only the lines that can (same as missing rates).
 */
export function ticketTotalSummary(lines: HowManyQtyLine[]): TicketTotalSummary | null {
  const withQty = lines.filter(
    (line) => line.lineStatus !== 'declined' && line.quantity != null && line.quantity > 0,
  );
  if (withQty.length === 0) return null;

  const grouped = groupHowManyByOrderUnit(withQty, (line) => line.unit);
  const units = grouped.map((group) => {
    return {
      unit: group.unit,
      qty: familyQtyLabel(group.items),
      money: formatTicketMoney(sumBillable(group.items)),
    };
  });
  if (units.length === 0) return null;

  const billed = sumBillable(withQty);
  const grand = units.length > 1 ? formatTicketMoney(billed) : null;
  return { units, grand, missingCue: ticketTotalMissingCue(withQty) };
}
