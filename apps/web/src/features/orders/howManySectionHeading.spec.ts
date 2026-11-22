import { describe, expect, it } from 'vitest';
import {
  howManyFooterMoneyAllowed,
  howManyFooterWithoutMoneyUnlessAllowed,
  howManySectionHeading,
} from './howManySectionHeading';

describe('howManySectionHeading', () => {
  it('joins shop and pack with a middle dot', () => {
    expect(howManySectionHeading({ shopName: 'Surat Silk', packName: 'Wedding' })).toBe(
      'Surat Silk · Wedding',
    );
  });

  it('returns whichever side exists', () => {
    expect(howManySectionHeading({ shopName: 'Surat Silk' })).toBe('Surat Silk');
    expect(howManySectionHeading({ packName: 'Wedding' })).toBe('Wedding');
    expect(howManySectionHeading({})).toBe('');
  });
});

describe('howManyFooterMoneyAllowed', () => {
  it('defaults off and requires every seller flag on', () => {
    expect(howManyFooterMoneyAllowed([])).toBe(false);
    expect(howManyFooterMoneyAllowed([false])).toBe(false);
    expect(howManyFooterMoneyAllowed([true, false])).toBe(false);
    expect(howManyFooterMoneyAllowed([true, true])).toBe(true);
  });

  it('strips money unless allowed', () => {
    const summary = { rows: ['2 sets'], money: '₹100' };
    expect(howManyFooterWithoutMoneyUnlessAllowed(summary, false)).toEqual({
      rows: ['2 sets'],
    });
    expect(howManyFooterWithoutMoneyUnlessAllowed(summary, true)).toEqual(summary);
  });
});
