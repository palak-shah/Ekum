import { describe, expect, it } from 'vitest';
import { showGroupSenderThumb } from './groupSenderThumb';

describe('showGroupSenderThumb', () => {
  it('only incoming group messages', () => {
    expect(showGroupSenderThumb({ isGroup: true, incoming: true })).toBe(true);
    expect(showGroupSenderThumb({ isGroup: true, incoming: false })).toBe(false);
    expect(showGroupSenderThumb({ isGroup: false, incoming: true })).toBe(false);
  });
});
