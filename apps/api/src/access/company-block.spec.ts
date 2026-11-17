import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
import { deleteOwnBlock, pairHasBlock, upsertOwnBlock } from './company-block';

describe('pairHasBlock', () => {
  it('is true when a directed edge exists', async () => {
    const db = {
      companyBlock: { count: async () => 1 },
      connection: { findUnique: async () => ({ status: ConnectionStatus.Active }) },
    };
    expect(await pairHasBlock(db, 'a', 'b')).toBe(true);
  });

  it('dual-reads legacy Connection blocked', async () => {
    const db = {
      companyBlock: { count: async () => 0 },
      connection: { findUnique: async () => ({ status: ConnectionStatus.Blocked }) },
    };
    expect(await pairHasBlock(db, 'a', 'b')).toBe(true);
  });
});

describe('upsertOwnBlock / deleteOwnBlock', () => {
  it('first edge wipes Follows; second does not; Unblock leaves the other edge', async () => {
    const edges: Array<{ blockerCompanyId: string; blockedCompanyId: string }> = [];
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const tx = {
      companyBlock: {
        findUnique: async ({
          where,
        }: {
          where: {
            blockerCompanyId_blockedCompanyId: {
              blockerCompanyId: string;
              blockedCompanyId: string;
            };
          };
        }) => {
          const hit = edges.find(
            (row) =>
              row.blockerCompanyId ===
                where.blockerCompanyId_blockedCompanyId.blockerCompanyId &&
              row.blockedCompanyId === where.blockerCompanyId_blockedCompanyId.blockedCompanyId,
          );
          return hit ? { id: 'e' } : null;
        },
        count: async ({
          where,
        }: {
          where: { OR: Array<{ blockerCompanyId: string; blockedCompanyId: string }> };
        }) =>
          where.OR.filter((clause) =>
            edges.some(
              (row) =>
                row.blockerCompanyId === clause.blockerCompanyId &&
                row.blockedCompanyId === clause.blockedCompanyId,
            ),
          ).length,
        create: async ({
          data,
        }: {
          data: { blockerCompanyId: string; blockedCompanyId: string };
        }) => {
          edges.push(data);
          return { id: 'new', ...data };
        },
        deleteMany: async ({
          where,
        }: {
          where: { blockerCompanyId: string; blockedCompanyId: string };
        }) => {
          const before = edges.length;
          for (let i = edges.length - 1; i >= 0; i -= 1) {
            const row = edges[i]!;
            if (
              row.blockerCompanyId === where.blockerCompanyId &&
              row.blockedCompanyId === where.blockedCompanyId
            ) {
              edges.splice(i, 1);
            }
          }
          return { count: before - edges.length };
        },
      },
      connection: {
        findUnique: async () => ({
          status: ConnectionStatus.Active,
          statusSetByCompanyId: null,
        }),
        create: vi.fn(async () => ({})),
        update: vi.fn(async () => ({})),
      },
      follow: { deleteMany },
      tradeLane: { findMany: vi.fn(async () => []), deleteMany: vi.fn(async () => ({ count: 0 })) },
    };

    const first = await upsertOwnBlock(tx as never, 'a', 'b');
    expect(first).toEqual({ created: true, firstEdge: true });
    expect(deleteMany).toHaveBeenCalledOnce();

    deleteMany.mockClear();
    const second = await upsertOwnBlock(tx as never, 'b', 'a');
    expect(second).toEqual({ created: true, firstEdge: false });
    expect(deleteMany).not.toHaveBeenCalled();
    expect(edges).toHaveLength(2);

    const cleared = await deleteOwnBlock(tx as never, 'a', 'b');
    expect(cleared).toEqual({ deleted: true, stillRestricted: true });
    expect(edges).toEqual([{ blockerCompanyId: 'b', blockedCompanyId: 'a' }]);
  });
});
