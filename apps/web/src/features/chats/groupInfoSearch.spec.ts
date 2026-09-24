import { describe, expect, it } from 'vitest';
import type { ParticipantView } from '@ekum/domain-types';
import { filterGroupCompanies } from './groupInfoSearch';

function row(id: string, name: string, city: string, state = 'active'): ParticipantView {
  return {
    companyId: id,
    state,
    alertLevel: 'all',
    lastReadAt: null,
    company: { id, name, city, verification: 'none', logoUrl: null },
  };
}

describe('filterGroupCompanies', () => {
  const rows = [
    row('a', 'Jaipur Emporium', 'Jaipur'),
    row('b', 'Surat Silk House', 'Surat'),
    row('c', 'Old Mill', 'Surat', 'archived'),
  ];

  it('hides archived shops and filters by name or city', () => {
    expect(filterGroupCompanies(rows, '').map((r) => r.companyId)).toEqual(['a', 'b']);
    expect(filterGroupCompanies(rows, 'surat').map((r) => r.company.name)).toEqual([
      'Surat Silk House',
    ]);
  });
});
