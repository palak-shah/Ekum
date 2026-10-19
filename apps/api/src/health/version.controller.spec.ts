import { describe, expect, it, vi } from 'vitest';
import { VersionController } from './version.controller';

describe('VersionController', () => {
  it('returns baked identity from config', () => {
    const values: Record<string, string> = {
      EKUM_VERSION: '0.1.0',
      EKUM_BUILD_ID: '2026-10-19T06-00-00-000Z-abc1234',
      EKUM_GIT_SHA: 'abc1234deadbeef',
      EKUM_BUILT_AT: '2026-10-19T06:00:00.000Z',
      EKUM_DEPLOYMENT: 'test',
    };
    const config = {
      get: vi.fn((key: string) => values[key]),
    };
    const controller = new VersionController(config as never);
    expect(controller.identity()).toEqual({
      service: 'ekum-api',
      version: '0.1.0',
      buildId: '2026-10-19T06-00-00-000Z-abc1234',
      gitSha: 'abc1234deadbeef',
      builtAt: '2026-10-19T06:00:00.000Z',
      deployment: 'test',
    });
  });
});
