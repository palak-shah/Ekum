import { describe, expect, it } from 'vitest';
import { messageHasClusterTail } from './messageClusterTail';

function msg(
  id: string,
  mine: boolean,
  senderCompanyId = mine ? 'us' : 'them',
  type = 'text',
) {
  return { id, mine, senderCompanyId, type };
}

describe('messageHasClusterTail', () => {
  it('tails only the last of a consecutive same-side run', () => {
    const messages = [
      msg('a', true),
      msg('b', true),
      msg('c', true),
      msg('d', false),
      msg('e', true),
      msg('f', true),
      msg('g', true),
      msg('h', true),
      msg('i', true),
    ];
    expect(messages.map((_, i) => messageHasClusterTail(messages, i))).toEqual([
      false,
      false,
      true,
      true,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('skips system notices and does not break a run', () => {
    const messages = [
      msg('a', true),
      { id: 'sys', mine: false, senderCompanyId: 'sys', type: 'system' },
      msg('b', true),
    ];
    expect(messageHasClusterTail(messages, 0)).toBe(false);
    expect(messageHasClusterTail(messages, 1)).toBe(false);
    expect(messageHasClusterTail(messages, 2)).toBe(true);
  });

  it('skips order_lifecycle tags with an order reference and does not break a run', () => {
    const messages = [
      msg('a', true),
      {
        id: 'tag',
        mine: false,
        senderCompanyId: 'them',
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_lifecycle', event: 'lines_decided' },
      },
      msg('b', true),
    ];
    expect(messageHasClusterTail(messages, 0)).toBe(false);
    expect(messageHasClusterTail(messages, 1)).toBe(false);
    expect(messageHasClusterTail(messages, 2)).toBe(true);
  });

  it('splits incoming group runs by sender shop', () => {
    const messages = [
      msg('a', false, 'shop-a'),
      msg('b', false, 'shop-a'),
      msg('c', false, 'shop-b'),
    ];
    expect(messageHasClusterTail(messages, 0)).toBe(false);
    expect(messageHasClusterTail(messages, 1)).toBe(true);
    expect(messageHasClusterTail(messages, 2)).toBe(true);
  });
});
