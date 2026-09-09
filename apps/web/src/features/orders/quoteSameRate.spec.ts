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

  it('restores defaults when Rate all is cleared', () => {
    expect(
      ratesWithSharedValue(['a', 'b'], '', { a: '90', b: '110' }),
    ).toEqual({ a: '90', b: '110' });
  });

  it('uses empty string when cleared and no default', () => {
    expect(ratesWithSharedValue(['a'], '  ', {})).toEqual({ a: '' });
  });
});
