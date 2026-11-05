import { ConnectionStatus, FollowStatus } from '@ekum/domain-types';
import { connectionPairWhere } from './connection-pair';

/** Minimal Prisma surface for Follow Allow → Active Connection. */
export type EnsureActiveConnectionDb = {
  connection: {
    findUnique: (args: {
      where: { companyLowId_companyHighId: { companyLowId: string; companyHighId: string } };
      select: { status: true };
    }) => Promise<{ status: string } | null>;
    upsert: (args: {
      where: { companyLowId_companyHighId: { companyLowId: string; companyHighId: string } };
      create: {
        companyLowId: string;
        companyHighId: string;
        status: string;
        statusSetByCompanyId: null;
      };
      update: { status: string; statusSetByCompanyId: null };
    }) => Promise<unknown>;
  };
  follow: {
    findMany: (args: {
      where: { status: string };
      select: { followerCompanyId: true; followedCompanyId: true };
    }) => Promise<Array<{ followerCompanyId: string; followedCompanyId: string }>>;
  };
};

export type EnsureActiveConnectionResult = 'created' | 'already_active' | 'skipped_blocked';

/**
 * Follow Allow → mutual Active Connection. Never lifts Block. Connect ⇏ Follow.
 */
export async function ensureActiveConnectionUnlessBlocked(
  prisma: EnsureActiveConnectionDb,
  companyA: string,
  companyB: string,
): Promise<EnsureActiveConnectionResult> {
  if (companyA === companyB) {
    return 'already_active';
  }
  const pair = connectionPairWhere(companyA, companyB);
  const existing = await prisma.connection.findUnique({
    where: { companyLowId_companyHighId: pair },
    select: { status: true },
  });
  if (existing?.status === ConnectionStatus.Blocked) {
    return 'skipped_blocked';
  }
  if (existing?.status === ConnectionStatus.Active) {
    return 'already_active';
  }
  await prisma.connection.upsert({
    where: { companyLowId_companyHighId: pair },
    create: {
      companyLowId: pair.companyLowId,
      companyHighId: pair.companyHighId,
      status: ConnectionStatus.Active,
      statusSetByCompanyId: null,
    },
    update: { status: ConnectionStatus.Active, statusSetByCompanyId: null },
  });
  return 'created';
}

export type BackfillAllowedFollowConnectionsResult = {
  examined: number;
  created: number;
  alreadyActive: number;
  skippedBlocked: number;
};

/**
 * Older Allowed follows (seed / pre-Allow-upsert) → Active Connection rows.
 * Idempotent. Never lifts Block.
 */
export async function backfillActiveConnectionsForAllowedFollows(
  prisma: EnsureActiveConnectionDb,
): Promise<BackfillAllowedFollowConnectionsResult> {
  const rows = await prisma.follow.findMany({
    where: { status: FollowStatus.Allowed },
    select: { followerCompanyId: true, followedCompanyId: true },
  });
  const seen = new Set<string>();
  let created = 0;
  let alreadyActive = 0;
  let skippedBlocked = 0;

  for (const row of rows) {
    const pair = connectionPairWhere(row.followerCompanyId, row.followedCompanyId);
    const key = `${pair.companyLowId}:${pair.companyHighId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const result = await ensureActiveConnectionUnlessBlocked(
      prisma,
      row.followerCompanyId,
      row.followedCompanyId,
    );
    if (result === 'created') created += 1;
    else if (result === 'already_active') alreadyActive += 1;
    else skippedBlocked += 1;
  }

  return {
    examined: seen.size,
    created,
    alreadyActive,
    skippedBlocked,
  };
}
