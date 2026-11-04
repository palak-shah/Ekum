import { describe, expect, it } from 'vitest';
import {
  peerCompanyIdFilter,
  pinOwnRows,
  prependOwnCapped,
  prependUniqueById,
} from './explore-own-pin';

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

  it('keeps at most two newest own packs ahead of peers', () => {
    const rows = [
      { id: 'peer-1', companyId: 'ravi' },
      { id: 'mine-1', companyId: 'meena' },
      { id: 'mine-2', companyId: 'meena' },
      { id: 'mine-3', companyId: 'meena' },
      { id: 'peer-2', companyId: 'kavita' },
    ];
    expect(pinOwnRows(rows, (row) => row.companyId === 'meena').map((row) => row.id)).toEqual([
      'mine-1',
      'mine-2',
      'peer-1',
      'peer-2',
      'mine-3',
    ]);
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

describe('peerCompanyIdFilter', () => {
  it('excludes the viewer even when they follow nobody', () => {
    expect(peerCompanyIdFilter('meena', [])).toEqual({ notIn: ['meena'] });
  });

  it('excludes the viewer and followed shops from the other lane', () => {
    expect(peerCompanyIdFilter('meena', ['ravi'])).toEqual({ notIn: ['meena', 'ravi'] });
  });
});

describe('prependOwnCapped', () => {
  it('pins two own packs then peers then remaining own', () => {
    const own = [{ id: 'mine-1' }, { id: 'mine-2' }, { id: 'mine-3' }];
    const rest = [{ id: 'ravi' }, { id: 'mine-1' }, { id: 'kavita' }];
    expect(prependOwnCapped(own, rest, (row) => row.id).map((row) => row.id)).toEqual([
      'mine-1',
      'mine-2',
      'ravi',
      'kavita',
      'mine-3',
    ]);
  });
});
