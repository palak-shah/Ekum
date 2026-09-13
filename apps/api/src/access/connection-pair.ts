import { ConnectionStatus } from '@ekum/domain-types';

/** Stable unordered pair for mutual Connection rows (`low < high` by string id). */
export function orderCompanyPair(
  a: string,
  b: string,
): { companyLowId: string; companyHighId: string } {
  if (a === b) {
    throw new Error('Connection pair requires two different companies.');
  }
  return a < b
    ? { companyLowId: a, companyHighId: b }
    : { companyLowId: b, companyHighId: a };
}

const STATUS_RANK: Record<string, number> = {
  [ConnectionStatus.Blocked]: 3,
  [ConnectionStatus.Paused]: 2,
  [ConnectionStatus.Active]: 1,
};

/** Prefer Blocked > Paused > Active when collapsing directed edges. */
export function mergeConnectionStatuses(...statuses: string[]): string {
  let best = ConnectionStatus.Active;
  let bestRank = 0;
  for (const status of statuses) {
    const rank = STATUS_RANK[status] ?? 0;
    if (rank > bestRank) {
      best = status;
      bestRank = rank;
    }
  }
  return best;
}

export function counterpartCompanyId(
  companyId: string,
  pair: { companyLowId: string; companyHighId: string },
): string {
  if (companyId === pair.companyLowId) return pair.companyHighId;
  if (companyId === pair.companyHighId) return pair.companyLowId;
  throw new Error('Company is not on this connection pair.');
}

/** Counterpart company ids from mutual rows that include `companyId`. */
export function counterpartIdsFromRows(
  companyId: string,
  rows: { companyLowId: string; companyHighId: string }[],
): string[] {
  return rows.map((row) => counterpartCompanyId(companyId, row));
}

/** Prisma findMany where: active mutual pairs involving this company. */
export function activeConnectionsForCompanyWhere(companyId: string) {
  return {
    status: ConnectionStatus.Active,
    OR: [{ companyLowId: companyId }, { companyHighId: companyId }],
  };
}

/** Prisma `where` for the unique mutual pair. */
export function connectionPairWhere(a: string, b: string) {
  return orderCompanyPair(a, b);
}

/**
 * Nested Company filter: no blocked mutual connection with `otherCompanyId`.
 * Covers both orientations via low/high relations.
 */
export function companyNotBlockedWith(otherCompanyId: string) {
  return {
    AND: [
      {
        connectionsAsLow: {
          none: { companyHighId: otherCompanyId, status: ConnectionStatus.Blocked },
        },
      },
      {
        connectionsAsHigh: {
          none: { companyLowId: otherCompanyId, status: ConnectionStatus.Blocked },
        },
      },
    ],
  };
}

/**
 * Nested Company filter: has an active mutual connection with `otherCompanyId`.
 */
export function companyActiveConnectedWith(otherCompanyId: string) {
  return {
    OR: [
      {
        connectionsAsLow: {
          some: { companyHighId: otherCompanyId, status: ConnectionStatus.Active },
        },
      },
      {
        connectionsAsHigh: {
          some: { companyLowId: otherCompanyId, status: ConnectionStatus.Active },
        },
      },
    ],
  };
}
