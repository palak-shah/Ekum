import { describe, expect, it } from 'vitest';
import { pinOwnRows, prependUniqueById } from './explore-own-pin';

describe('pinOwnRows', () => {
  it('moves the viewer’s rows ahead of followed shops', () => {
    const rows = [
      { id: 'ravi-1', companyId: 'ravi' },
      { id: 'ravi-2', companyId: 'ravi' },
      { id: 'mine', companyId: 'meena' },
    ];
    expect(pinOwnRows(rows, (row) => row.companyId === 'meena').map((row) => row.id)).toEqual([
      'mine',
      'ravi-1',
      'ravi-2',
    ]);
  });

  it('leaves a list unchanged when the viewer has no rows', () => {
    const rows = [{ id: 'ravi-1', companyId: 'ravi' }];
    expect(pinOwnRows(rows, (row) => row.companyId === 'meena')).toEqual(rows);
  });
});

describe('prependUniqueById', () => {
  it('puts own packs first and drops duplicates from the ranked window', () => {
    const own = [{ id: 'mine' }, { id: 'also' }];
    const rest = [{ id: 'ravi' }, { id: 'mine' }, { id: 'kavita' }];
    expect(prependUniqueById(own, rest, (row) => row.id).map((row) => row.id)).toEqual([
      'mine',
      'also',
      'ravi',
      'kavita',
    ]);
  });
});
