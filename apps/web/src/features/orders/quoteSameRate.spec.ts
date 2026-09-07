import { describe, expect, it } from 'vitest';
import { ratesWithSharedValue } from './quoteSameRate';

describe('ratesWithSharedValue', () => {
  it('copies one rate onto every line', () => {
    expect(ratesWithSharedValue(['a', 'b', 'c'], '120')).toEqual({
      a: '120',
      b: '120',
      c: '120',
    });
  });
});
