import { describe, expect, it } from 'vitest';
import { isHeldFromSupplier } from './orderHold';

describe('isHeldFromSupplier', () => {
  const held = {
    sellerCompanyId: 'mill',
    downstreamOrderId: 'down-1',
    upstreamReleasedAt: null,
  };

  it('hides held hop from the mill', () => {
    expect(isHeldFromSupplier(held, 'mill')).toBe(true);
  });

  it('lets the handler (buyer on the hop) see it', () => {
    expect(isHeldFromSupplier(held, 'trader')).toBe(false);
  });

  it('after Send the mill can see it', () => {
    expect(
      isHeldFromSupplier({ ...held, upstreamReleasedAt: new Date() }, 'mill'),
    ).toBe(false);
  });

  it('plain orders are never held', () => {
    expect(
      isHeldFromSupplier(
        { sellerCompanyId: 'mill', downstreamOrderId: null, upstreamReleasedAt: null },
        'mill',
      ),
    ).toBe(false);
  });
});
