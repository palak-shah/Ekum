import type { AuditActorView } from '@ekum/domain-types';

type ActorRow = { id: string; name: string | null } | null | undefined;

export function toAuditActor(user: ActorRow): AuditActorView | null {
  if (!user) return null;
  return { id: user.id, name: user.name };
}

/** Inclusive createdAt range from query strings (ISO or YYYY-MM-DD). */
export function createdAtRangeFilter(query: {
  createdFrom?: string;
  createdTo?: string;
}): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {};
  if (query.createdFrom) {
    const from = parseDayBound(query.createdFrom, 'start');
    if (from) range.gte = from;
  }
  if (query.createdTo) {
    const to = parseDayBound(query.createdTo, 'end');
    if (to) range.lte = to;
  }
  return range.gte || range.lte ? range : undefined;
}

function parseDayBound(raw: string, edge: 'start' | 'end'): Date | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const iso =
      edge === 'start' ? `${trimmed}T00:00:00.000Z` : `${trimmed}T23:59:59.999Z`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function createdAtOrderBy(sort: 'newest' | 'oldest' | undefined) {
  const dir = sort === 'oldest' ? ('asc' as const) : ('desc' as const);
  return [{ createdAt: dir }, { id: dir }] as const;
}
