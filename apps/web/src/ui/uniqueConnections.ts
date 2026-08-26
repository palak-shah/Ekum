import type { ConnectionView } from '@ekum/domain-types';

/** `/connections` returns both directions — one row per company. */
export function uniqueConnectionsByCompany(rows: ConnectionView[]): ConnectionView[] {
  const seen = new Set<string>();
  const unique: ConnectionView[] = [];
  for (const row of rows) {
    const id = row.company.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(row);
  }
  return unique;
}
