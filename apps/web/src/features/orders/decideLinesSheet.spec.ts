import { describe, expect, it } from 'vitest';
import { decideLinesPayload, decideLinesTally, defaultLineActions } from './decideLinesSheet';

describe('decideLinesSheet', () => {
  const ids = ['a', 'b', 'c'];

  it('starts every line confirmed', () => {
    expect(defaultLineActions(ids)).toEqual({ a: 'confirm', b: 'confirm', c: 'confirm' });
  });

  it('Confirm writes tick as confirm and off as decline', () => {
    expect(
      decideLinesPayload(ids, { a: 'confirm', b: 'decline', c: 'confirm' }, 'confirm'),
    ).toEqual([
      { orderItemId: 'a', action: 'confirm' },
      { orderItemId: 'b', action: 'decline' },
      { orderItemId: 'c', action: 'confirm' },
    ]);
  });

  it('Decline writes every open line as decline', () => {
    expect(
      decideLinesPayload(ids, { a: 'confirm', b: 'confirm', c: 'confirm' }, 'decline'),
    ).toEqual([
      { orderItemId: 'a', action: 'decline' },
      { orderItemId: 'b', action: 'decline' },
      { orderItemId: 'c', action: 'decline' },
    ]);
  });

  it('tallies confirm vs decline', () => {
    expect(decideLinesTally(ids, { a: 'confirm', b: 'decline', c: 'confirm' })).toEqual({
      confirm: 2,
      decline: 1,
    });
  });
});
