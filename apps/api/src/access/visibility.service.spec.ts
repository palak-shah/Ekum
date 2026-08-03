import { describe, expect, it } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
import { VisibilityService } from './visibility.service';
import type { PrismaService } from '../core/prisma/prisma.service';

function withConnection(connection: { status: string } | null): VisibilityService {
  const prisma = {
    connection: { findUnique: async () => connection },
  } as unknown as PrismaService;
  return new VisibilityService(prisma);
}

describe('VisibilityService', () => {
  it('always allows a company to view its own catalogue', async () => {
    const service = withConnection(null);
    expect(await service.canViewCatalog('company-1', 'company-1')).toBe(true);
  });

  it('allows viewing when an active connection exists', async () => {
    const service = withConnection({ status: ConnectionStatus.Active });
    expect(await service.canViewCatalog('viewer', 'owner')).toBe(true);
  });

  it('denies viewing when the connection is paused', async () => {
    const service = withConnection({ status: ConnectionStatus.Paused });
    expect(await service.canViewCatalog('viewer', 'owner')).toBe(false);
  });

  it('denies viewing when there is no connection', async () => {
    const service = withConnection(null);
    expect(await service.canViewCatalog('viewer', 'owner')).toBe(false);
  });

  it('reports blocked connections so the API can respond 404', async () => {
    const service = withConnection({ status: ConnectionStatus.Blocked });
    expect(await service.isBlocked('viewer', 'owner')).toBe(true);
  });

  it('never treats a company as blocking itself', async () => {
    const service = withConnection({ status: ConnectionStatus.Blocked });
    expect(await service.isBlocked('company-1', 'company-1')).toBe(false);
  });
});
