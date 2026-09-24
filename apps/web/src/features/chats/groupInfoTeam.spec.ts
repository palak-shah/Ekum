import { describe, expect, it } from 'vitest';
import type { ThreadPersonView } from '@ekum/domain-types';
import { peopleOnOurSide, sortGroupTeam } from './groupInfoTeam';

function person(userId: string, name: string, role: string, state = 'active'): ThreadPersonView {
  return { userId, name, role, state };
}

describe('groupInfoTeam', () => {
  it('drops left/archived seats and keeps our side only', () => {
    expect(
      peopleOnOurSide([
        person('a', 'Priya', 'staff'),
        person('b', 'Old', 'staff', 'left'),
        person('c', 'Gone', 'owner', 'archived'),
      ]).map((row) => row.userId),
    ).toEqual(['a']);
  });

  it('lists staff then owners', () => {
    expect(
      sortGroupTeam([
        person('o', 'Meena', 'owner'),
        person('s', 'Priya', 'staff'),
      ]).map((row) => row.name),
    ).toEqual(['Priya', 'Meena']);
  });
});
