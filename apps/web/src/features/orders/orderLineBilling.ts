import {
  isPackOrderUnit,
  lineBillAmount,
  lineDispatchQty,
  orderBillTotal,
  packSizeForUnit,
} from '@ekum/domain-types';
import { formatCatalogRate } from '@/lib/catalogRate';
import { unitCountNoun } from '@/features/catalog/orderDispatchPreview';

export {
  isPackOrderUnit,
  lineBillAmount,
  lineDispatchQty,
  orderBillTotal,
  packSizeForUnit,
};

/** Dual qty for packing slip / facts: `10 set (= 40 pc)` or `10 set` when blank. */
export function formatDualQty(input: {
  quantity: number;
  unit?: string | null;
  piecesPerPack?: number | null;
  dispatchUnit?: string | null;
}): string {
  const qty = input.quantity;
  const unit = input.unit?.trim() || '';
  const orderNoun = unit ? unitCountNoun(unit, qty) : String(qty);
  const primary = unit ? `${qty} ${orderNoun}` : String(qty);
  if (!isPackOrderUnit(unit)) return primary;
  const pack = packSizeForUnit(unit, input.piecesPerPack);
  if (pack == null) return primary;
  const dispatchQty = qty * pack;
  const dispatch = input.dispatchUnit?.trim() || 'pc';
  return `${primary} (= ${dispatchQty} ${unitCountNoun(dispatch, dispatchQty)})`;
}

/** Packing-slip / How many style total: `Total 80 pc and 20 sets` when dispatch known. */
export function formatPackingSlipTotal(input: {
  lines: Array<{
    quantity: number;
    unit?: string | null;
    piecesPerPack?: number | null;
    dispatchUnit?: string | null;
  }>;
}): string | null {
  const lines = input.lines.filter((l) => l.quantity > 0);
  if (lines.length === 0) return null;

  const packLines = lines.filter((l) => isPackOrderUnit(l.unit));
  if (packLines.length === 0) {
    const unit = lines[0]?.unit?.trim() || 'pc';
    const same = lines.every((l) => (l.unit?.trim() || 'pc') === unit);
    if (!same) return null;
    const total = lines.reduce((s, l) => s + l.quantity, 0);
    return `Total ${total} ${unitCountNoun(unit, total)}`;
  }

  const orderTotal = packLines.reduce((s, l) => s + l.quantity, 0);
  const orderNoun =
    packLines.every((l) => l.unit?.trim() === 'set')
      ? unitCountNoun('set', orderTotal)
      : packLines.every((l) => l.unit?.trim() === 'dozen')
        ? unitCountNoun('dozen', orderTotal)
        : 'packs';

  const allKnown = packLines.every(
    (l) => packSizeForUnit(l.unit, l.piecesPerPack) != null,
  );
  if (!allKnown) {
    return `Total ${orderTotal} ${orderNoun}`;
  }

  const dispatchTotal = packLines.reduce((sum, l) => {
    const pack = packSizeForUnit(l.unit, l.piecesPerPack) ?? 0;
    return sum + l.quantity * pack;
  }, 0);
  const dispatch =
    packLines.every((l) => (l.dispatchUnit?.trim() || 'pc') === (packLines[0]?.dispatchUnit?.trim() || 'pc'))
      ? packLines[0]?.dispatchUnit?.trim() || 'pc'
      : 'pc';
  return `Total ${dispatchTotal} ${unitCountNoun(dispatch, dispatchTotal)} and ${orderTotal} ${orderNoun}`;
}

/** Quiet caption lines for order detail: set=N, price, order qty, ₹. */
export function orderLineBillingCaptions(item: {
  quantity: number;
  rate: number | null;
  unit?: string | null;
  piecesPerPack?: number | null;
  dispatchUnit?: string | null;
}): string[] {
  const lines: string[] = [];
  const unit = item.unit?.trim() || null;
  const dispatch = item.dispatchUnit?.trim() || 'pc';
  const pack = packSizeForUnit(unit, item.piecesPerPack);

  if (isPackOrderUnit(unit) && pack != null) {
    lines.push(
      `1 ${unitCountNoun(unit, 1)} = ${pack} ${unitCountNoun(dispatch, pack)}`,
    );
  }

  if (item.rate != null) {
    const rate = formatCatalogRate({
      rate: item.rate,
      unit,
      dispatchUnit: item.dispatchUnit,
    });
    if (rate !== 'On request') {
      lines.push(
        isPackOrderUnit(unit)
          ? `price per ${dispatch} = ₹${item.rate.toLocaleString('en-IN')}`
          : rate,
      );
    }
  }

  if (isPackOrderUnit(unit)) {
    if (pack != null) {
      const dispatchQty = item.quantity * pack;
      lines.push(
        `order = ${item.quantity} ${unitCountNoun(unit, item.quantity)} = ${dispatchQty} ${unitCountNoun(dispatch, dispatchQty)}`,
      );
    } else {
      lines.push(
        `order = ${item.quantity} ${unitCountNoun(unit, item.quantity)}`,
      );
    }
  }

  const bill = lineBillAmount({
    quantity: item.quantity,
    rate: item.rate,
    unit,
    piecesPerPack: item.piecesPerPack,
  });
  if (bill != null) {
    lines.push(`₹${bill.toLocaleString('en-IN')}`);
  }

  return lines;
}
