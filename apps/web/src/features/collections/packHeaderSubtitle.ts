import { designCountLabel } from '@/ui/albumMosaic';
import { formatRate } from '@/lib/format';

export type PackRateMember = {
  rate: number | null;
  rateMax?: number | null;
  unit: string | null;
};

/** ₹ band with a space before the unit (`₹280–₹445 /mtr`). */
export function packRateBand(products: PackRateMember[]): string | null {
  const priced = products.filter((row) => row.rate != null);
  if (priced.length === 0) return null;
  const units = new Set(priced.map((row) => row.unit ?? ''));
  if (units.size > 1) return null;
  const lows = priced.map((row) => row.rate as number);
  const highs = priced.map((row) =>
    row.rateMax != null && row.rateMax > (row.rate as number) ? row.rateMax : (row.rate as number),
  );
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const unit = priced[0]?.unit ?? null;
  const formatted = formatRate(min, unit, max > min ? max : null);
  if (!unit) return formatted;
  return formatted.replace(/\/(?=[^/]+$)/, ' /');
}

export function packHeaderSubtitle(productCount: number, products: PackRateMember[] = []): string {
  const count = designCountLabel(productCount);
  const band = packRateBand(products);
  return band ? `${count} · ${band}` : count;
}

/** Shop line on a design tile / popup. Curated foreign on own pack keeps From. */
export function designCardShopLine(shopName: string | null | undefined, curatedFrom = false): string | null {
  const name = shopName?.trim();
  if (!name) return null;
  return curatedFrom ? `From ${name}` : name;
}
