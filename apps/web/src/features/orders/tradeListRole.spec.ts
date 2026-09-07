import { describe, expect, it } from 'vitest';
import { linkedMillHaystack, orderListLinkedCue, orderListRoleBit } from './tradeListRole';

describe('orderListRoleBit', () => {
  it('marks I-handle sell as Trading', () => {
    expect(
      orderListRoleBit({ tradeMode: 'manage', direction: 'selling', intent: 'order' }, false),
    ).toBe('Trading');
  });

  it('keeps You sell for a normal ticket', () => {
    expect(
      orderListRoleBit({ tradeMode: 'bilateral', direction: 'selling', intent: 'order' }, false),
    ).toBe('You sell');
  });

  it('joins mill names for the list cue', () => {
    expect(
      orderListLinkedCue([
        { name: 'Surat Silk House', orderId: 'abc' },
        { name: 'Jaipur Emporium', orderId: null },
      ]),
    ).toBe('Surat Silk House + Jaipur Emporium');
  });

  it('indexes mill # for Find', () => {
    const hay = linkedMillHaystack({
      linkedMills: [{ name: 'Surat Silk House', orderId: 'seedorderhandleup' }],
    });
    expect(hay.toLowerCase()).toContain('surat');
    expect(hay).toContain('seedorderhandleup');
  });
});
