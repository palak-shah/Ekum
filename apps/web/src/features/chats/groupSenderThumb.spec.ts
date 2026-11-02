import { describe, expect, it } from 'vitest';
import { reserveIncomingSenderThumb, showGroupSenderThumb } from './groupSenderThumb';

describe('incoming sender thumb', () => {
  it('reserves a column only on group incoming', () => {
    expect(reserveIncomingSenderThumb({ isGroup: true, incoming: true })).toBe(true);
    expect(reserveIncomingSenderThumb({ isGroup: true, incoming: false })).toBe(false);
    expect(reserveIncomingSenderThumb({ isGroup: false, incoming: true })).toBe(false);
  });

  it('draws the avatar only on the last of a group streak', () => {
    expect(showGroupSenderThumb({ isGroup: true, incoming: true, clusterTail: true })).toBe(true);
    expect(showGroupSenderThumb({ isGroup: true, incoming: true, clusterTail: false })).toBe(false);
    expect(showGroupSenderThumb({ isGroup: true, incoming: false, clusterTail: true })).toBe(false);
    expect(showGroupSenderThumb({ isGroup: false, incoming: true, clusterTail: true })).toBe(false);
  });
});
