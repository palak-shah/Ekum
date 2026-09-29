import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import { complaintOrderHaystack, complaintOrderThumb, complaintOrderTitle } from './complaintOrderCue';

function order(items: OrderView['items']): OrderView {
  return { id: 'ord-hidden-hash', items } as OrderView;
}

describe('complaintOrderCue', () => {
  it('names designs, not the order hash', () => {
    expect(
      complaintOrderTitle(
        order([
          { name: 'Navy satin' } as OrderView['items'][number],
          { name: 'Gold border' } as OrderView['items'][number],
          { name: 'Print 12' } as OrderView['items'][number],
        ]),
      ),
    ).toBe('Navy satin · Gold border +1');
    expect(complaintOrderTitle(order([]))).toBe('This order');
  });

  it('finds by design name without needing the id', () => {
    const row = order([{ name: 'Navy satin', sku: 'EK-1' } as OrderView['items'][number]]);
    expect(complaintOrderHaystack(row, 'Requested', '29 Sep')).toContain('navy satin');
  });

  it('uses the first line photo', () => {
    expect(
      complaintOrderThumb(
        order([
          { name: 'A', image: null, images: [] } as OrderView['items'][number],
          { name: 'B', image: '/media/b.jpg', images: [] } as OrderView['items'][number],
        ]),
      ),
    ).toBe('/media/b.jpg');
  });
});
