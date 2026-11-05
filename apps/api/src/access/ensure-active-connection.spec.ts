import { describe, expect, it } from 'vitest';
import { ConnectionStatus, FollowStatus } from '@ekum/domain-types';
import {
  backfillActiveConnectionsForAllowedFollows,
  ensureActiveConnectionUnlessBlocked,
  type EnsureActiveConnectionDb,
} from './ensure-active-connection';

function makeDb(options: {
  connections?: Array<{ low: string; high: string; status: string }>;
  follows?: Array<{ followerCompanyId: string; followedCompanyId: string }>;
}): EnsureActiveConnectionDb & {
  connections: Array<{ low: string; high: string; status: string }>;
} {
  const connections = [...(options.connections ?? [])];
  return {
    connections,
    connection: {
      findUnique: async ({
        where,
      }: {
        where: { companyLowId_companyHighId: { companyLowId: string; companyHighId: string } };
      }) => {
        const pair = where.companyLowId_companyHighId;
        const hit = connections.find(
          (row) => row.low === pair.companyLowId && row.high === pair.companyHighId,
        );
        return hit ? { status: hit.status } : null;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { companyLowId_companyHighId: { companyLowId: string; companyHighId: string } };
        create: { companyLowId: string; companyHighId: string; status: string };
        update: { status: string };
      }) => {
        const pair = where.companyLowId_companyHighId;
        const idx = connections.findIndex(
          (row) => row.low === pair.companyLowId && row.high === pair.companyHighId,
        );
        if (idx >= 0) {
          connections[idx] = { ...connections[idx]!, status: update.status };
        } else {
          connections.push({
            low: create.companyLowId,
            high: create.companyHighId,
            status: create.status,
          });
        }
        return {};
      },
    },
    follow: {
      findMany: async () => options.follows ?? [],
    },
  };
}

describe('ensureActiveConnectionUnlessBlocked', () => {
  it('creates Active Connection when missing', async () => {
    const db = makeDb({});
    await expect(
      ensureActiveConnectionUnlessBlocked(db, 'meena', 'kavita'),
    ).resolves.toBe('created');
    expect(db.connections).toEqual([
      { low: 'kavita', high: 'meena', status: ConnectionStatus.Active },
    ]);
  });

  it('no-ops when already Active', async () => {
    const db = makeDb({
      connections: [{ low: 'kavita', high: 'meena', status: ConnectionStatus.Active }],
    });
    await expect(
      ensureActiveConnectionUnlessBlocked(db, 'meena', 'kavita'),
    ).resolves.toBe('already_active');
    expect(db.connections).toHaveLength(1);
  });

  it('never lifts Block', async () => {
    const db = makeDb({
      connections: [{ low: 'kavita', high: 'meena', status: ConnectionStatus.Blocked }],
    });
    await expect(
      ensureActiveConnectionUnlessBlocked(db, 'meena', 'kavita'),
    ).resolves.toBe('skipped_blocked');
    expect(db.connections[0]?.status).toBe(ConnectionStatus.Blocked);
  });

  it('reactivates paused to Active', async () => {
    const db = makeDb({
      connections: [{ low: 'kavita', high: 'meena', status: ConnectionStatus.Paused }],
    });
    await expect(
      ensureActiveConnectionUnlessBlocked(db, 'meena', 'kavita'),
    ).resolves.toBe('created');
    expect(db.connections[0]?.status).toBe(ConnectionStatus.Active);
  });
});

describe('backfillActiveConnectionsForAllowedFollows', () => {
  it('upserts Active for Allowed follows missing Connection', async () => {
    const db = makeDb({
      follows: [
        { followerCompanyId: 'meena', followedCompanyId: 'kavita' },
        { followerCompanyId: 'meena', followedCompanyId: 'ravi' },
      ],
      connections: [{ low: 'meena', high: 'ravi', status: ConnectionStatus.Active }],
    });
    const result = await backfillActiveConnectionsForAllowedFollows(db);
    expect(result).toEqual({
      examined: 2,
      created: 1,
      alreadyActive: 1,
      skippedBlocked: 0,
    });
    expect(db.connections).toContainEqual({
      low: 'kavita',
      high: 'meena',
      status: ConnectionStatus.Active,
    });
  });

  it('skips Blocked pairs', async () => {
    const db = makeDb({
      follows: [{ followerCompanyId: 'meena', followedCompanyId: 'kavita' }],
      connections: [{ low: 'kavita', high: 'meena', status: ConnectionStatus.Blocked }],
    });
    const result = await backfillActiveConnectionsForAllowedFollows(db);
    expect(result.skippedBlocked).toBe(1);
    expect(result.created).toBe(0);
    expect(db.connections[0]?.status).toBe(ConnectionStatus.Blocked);
  });

  it('dedupes both directions of the same company pair', async () => {
    const db = makeDb({
      follows: [
        { followerCompanyId: 'a', followedCompanyId: 'b' },
        { followerCompanyId: 'b', followedCompanyId: 'a' },
      ],
    });
    const result = await backfillActiveConnectionsForAllowedFollows(db);
    expect(result.examined).toBe(1);
    expect(result.created).toBe(1);
    expect(db.connections).toHaveLength(1);
  });

  it('only considers Allowed status in the query contract', () => {
    expect(FollowStatus.Allowed).toBe('allowed');
  });
});
