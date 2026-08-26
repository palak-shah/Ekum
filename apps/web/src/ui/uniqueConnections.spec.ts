import { describe, expect, it } from 'vitest';
import type { ConnectionView } from '@ekum/domain-types';
import { uniqueConnectionsByCompany } from './uniqueConnections';

function row(id: string, name: string): ConnectionView {
  return {
    id: `conn-${id}-${name}`,
    company: { id, name, city: 'Surat', logoUrl: null },
  } as ConnectionView;
}

describe('uniqueConnectionsByCompany', () => {
  it('keeps one row when the same company appears twice', () => {
    const unique = uniqueConnectionsByCompany([
      row('c1', 'Jaipur Emporium'),
      row('c1', 'Jaipur Emporium'),
      row('c2', 'Loom'),
    ]);
    expect(unique.map((r) => r.company.id)).toEqual(['c1', 'c2']);
  });
});
