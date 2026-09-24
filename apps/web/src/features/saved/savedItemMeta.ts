import type { SavedItemView } from '@ekum/domain-types';
import { formatRate } from '@/lib/format';

/** Subtitle under a Saved tile — never the saver’s own name (BM — client Saved clutter). */
export function savedItemMeta(item: SavedItemView): string {
  if (item.kind === 'product') {
    const bits = [item.company.name];
    if (item.sku) bits.push(item.sku);
    bits.push(formatRate(item.rate ?? null, item.unit ?? null));
    return bits.join(' · ');
  }
  const bits = [item.company.name];
  if (item.productCount != null) {
    bits.push(`${item.productCount} design${item.productCount === 1 ? '' : 's'}`);
  } else {
    bits.push('Collection');
  }
  return bits.join(' · ');
}
