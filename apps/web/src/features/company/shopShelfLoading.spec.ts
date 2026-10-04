import { describe, expect, it } from 'vitest';
import { shopShelfLoading } from './shopShelfLoading';

describe('shopShelfLoading', () => {
  it('gates collections tab on collections only', () => {
    expect(shopShelfLoading('collections', true, true)).toBe(true);
    expect(shopShelfLoading('collections', false, true)).toBe(false);
  });

  it('gates designs tab on designs only', () => {
    expect(shopShelfLoading('designs', true, true)).toBe(true);
    expect(shopShelfLoading('designs', true, false)).toBe(false);
  });
});
