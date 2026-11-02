import { describe, expect, it, vi } from 'vitest';
import { millShareActive, millShareActiveSet } from './mill-share';

describe('millShareActive', () => {
  it('is true only for an allowed Pack follow', async () => {
    const prisma = {
      follow: {
        findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })),
        findMany: vi.fn(),
      },
    };
    await expect(millShareActive(prisma as never, 'trader', 'mill')).resolves.toBe(true);
  });

  it('is false for Look', async () => {
    const prisma = {
      follow: {
        findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'look' })),
        findMany: vi.fn(),
      },
    };
    await expect(millShareActive(prisma as never, 'trader', 'mill')).resolves.toBe(false);
  });
});

describe('millShareActiveSet', () => {
  it('returns mill ids that still grant Pack', async () => {
    const prisma = {
      follow: {
        findUnique: vi.fn(),
        findMany: vi.fn(async () => [{ followedCompanyId: 'mill-a' }]),
      },
    };
    const set = await millShareActiveSet(prisma as never, 'trader', ['mill-a', 'mill-b']);
    expect([...set]).toEqual(['mill-a']);
  });
});
