import { describe, expect, it } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
import { VisibilityService } from './visibility.service';
import type { PrismaService } from '../core/prisma/prisma.service';

function withDb(options: {
  connection?: { status: string } | null;
  blockCount?: number;
}): VisibilityService {
  const prisma = {
    connection: { findUnique: async () => options.connection ?? null },
    companyBlock: { count: async () => options.blockCount ?? 0 },
  } as unknown as PrismaService;
  return new VisibilityService(prisma);
}

describe('VisibilityService', () => {
  it('always allows a company to view its own catalogue', async () => {
    const service = withDb({ connection: null });
    expect(await service.canViewCatalog('company-1', 'company-1')).toBe(true);
  });

  it('allows viewing when an active connection exists', async () => {
    const service = withDb({ connection: { status: ConnectionStatus.Active } });
    expect(await service.canViewCatalog('viewer', 'owner')).toBe(true);
  });

  it('denies viewing when the connection is paused', async () => {
    const service = withDb({ connection: { status: ConnectionStatus.Paused } });
    expect(await service.canViewCatalog('viewer', 'owner')).toBe(false);
  });

  it('denies viewing when there is no connection', async () => {
    const service = withDb({ connection: null });
    expect(await service.canViewCatalog('viewer', 'owner')).toBe(false);
  });

  it('reports directed CompanyBlock so the API can respond 404', async () => {
    const service = withDb({
      connection: { status: ConnectionStatus.Active },
      blockCount: 1,
    });
    expect(await service.isBlocked('viewer', 'owner')).toBe(true);
  });

  it('dual-reads legacy Connection.status=blocked', async () => {
    const service = withDb({
      connection: { status: ConnectionStatus.Blocked },
      blockCount: 0,
    });
    expect(await service.isBlocked('viewer', 'owner')).toBe(true);
  });

  it('never treats a company as blocking itself', async () => {
    const service = withDb({
      connection: { status: ConnectionStatus.Blocked },
      blockCount: 1,
    });
    expect(await service.isBlocked('company-1', 'company-1')).toBe(false);
  });
});
