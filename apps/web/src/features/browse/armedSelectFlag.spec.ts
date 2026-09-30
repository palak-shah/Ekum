import { describe, expect, it } from 'vitest';
import { createArmedSelectFlag } from './armedSelectFlag';

describe('createArmedSelectFlag', () => {
  it('notifies subscribers when empty Selecting is armed', () => {
    const flag = createArmedSelectFlag();
    const seen: boolean[] = [];
    flag.subscribe(() => seen.push(flag.get()));
    flag.set(true);
    flag.set(true);
    flag.set(false);
    expect(seen).toEqual([true, false]);
  });
});
