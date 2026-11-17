import type { Prisma } from '@prisma/client';
import { ConnectionStatus } from '@ekum/domain-types';
import { applyBlockSideEffects } from './block-side-effects';
import { connectionPairWhere } from './connection-pair';

type Tx = Prisma.TransactionClient;

type BlockCountDb = {
  companyBlock: {
    count: (args: {
      where: {
        OR: Array<{ blockerCompanyId: string; blockedCompanyId: string }>;
      };
    }) => Promise<number>;
  };
  connection: {
    findUnique: (args: {
      where: { companyLowId_companyHighId: { companyLowId: string; companyHighId: string } };
      select: { status: true };
    }) => Promise<{ status: string } | null>;
  };
};

/** Either directed edge means the pair is restricted. Dual-reads legacy status=blocked. */
export async function pairHasBlock(
  db: BlockCountDb,
  companyA: string,
  companyB: string,
): Promise<boolean> {
  if (companyA === companyB) return false;
  const edges = await db.companyBlock.count({
    where: {
      OR: [
        { blockerCompanyId: companyA, blockedCompanyId: companyB },
        { blockerCompanyId: companyB, blockedCompanyId: companyA },
      ],
    },
  });
  if (edges > 0) return true;
  const pair = connectionPairWhere(companyA, companyB);
  const legacy = await db.connection.findUnique({
    where: { companyLowId_companyHighId: pair },
    select: { status: true },
  });
  return legacy?.status === ConnectionStatus.Blocked;
}

export async function hasOwnBlock(
  db: {
    companyBlock: {
      findUnique: (args: {
        where: {
          blockerCompanyId_blockedCompanyId: {
            blockerCompanyId: string;
            blockedCompanyId: string;
          };
        };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  },
  blockerCompanyId: string,
  blockedCompanyId: string,
): Promise<boolean> {
  const row = await db.companyBlock.findUnique({
    where: {
      blockerCompanyId_blockedCompanyId: { blockerCompanyId, blockedCompanyId },
    },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Insert own directed block. First edge for the pair runs Follow wipe + DL keep.
 * Ensures a Connection row exists as Active (never writes status=blocked).
 * Leaves legacy Paused rows' status alone.
 */
export async function upsertOwnBlock(
  tx: Tx,
  blockerCompanyId: string,
  blockedCompanyId: string,
): Promise<{ created: boolean; firstEdge: boolean }> {
  const existingOwn = await tx.companyBlock.findUnique({
    where: {
      blockerCompanyId_blockedCompanyId: {
        blockerCompanyId,
        blockedCompanyId,
      },
    },
    select: { id: true },
  });
  if (existingOwn) {
    return { created: false, firstEdge: false };
  }

  const priorCount = await tx.companyBlock.count({
    where: {
      OR: [
        { blockerCompanyId, blockedCompanyId },
        { blockerCompanyId: blockedCompanyId, blockedCompanyId: blockerCompanyId },
      ],
    },
  });
  const firstEdge = priorCount === 0;
  if (firstEdge) {
    await applyBlockSideEffects(tx, blockerCompanyId, blockedCompanyId);
  }

  await tx.companyBlock.create({
    data: { blockerCompanyId, blockedCompanyId },
  });

  const pair = connectionPairWhere(blockerCompanyId, blockedCompanyId);
  const current = await tx.connection.findUnique({
    where: { companyLowId_companyHighId: pair },
    select: { status: true },
  });

  if (!current) {
    await tx.connection.create({
      data: {
        companyLowId: pair.companyLowId,
        companyHighId: pair.companyHighId,
        status: ConnectionStatus.Active,
        statusSetByCompanyId: null,
      },
    });
  } else if (current.status === ConnectionStatus.Blocked) {
    await tx.connection.update({
      where: { companyLowId_companyHighId: pair },
      data: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
    });
  } else if (current.status !== ConnectionStatus.Paused) {
    await tx.connection.update({
      where: { companyLowId_companyHighId: pair },
      data: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
    });
  }

  return { created: true, firstEdge };
}

/** Delete own edge only. */
export async function deleteOwnBlock(
  tx: Tx,
  blockerCompanyId: string,
  blockedCompanyId: string,
): Promise<{ deleted: boolean; stillRestricted: boolean }> {
  const result = await tx.companyBlock.deleteMany({
    where: { blockerCompanyId, blockedCompanyId },
  });
  const remaining = await tx.companyBlock.count({
    where: {
      OR: [
        { blockerCompanyId, blockedCompanyId },
        { blockerCompanyId: blockedCompanyId, blockedCompanyId: blockerCompanyId },
      ],
    },
  });
  const pair = connectionPairWhere(blockerCompanyId, blockedCompanyId);
  const legacy = await tx.connection.findUnique({
    where: { companyLowId_companyHighId: pair },
    select: { status: true },
  });
  if (remaining === 0 && legacy?.status === ConnectionStatus.Blocked) {
    await tx.connection.update({
      where: { companyLowId_companyHighId: pair },
      data: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
    });
  }
  return {
    deleted: result.count > 0,
    stillRestricted: remaining > 0,
  };
}
