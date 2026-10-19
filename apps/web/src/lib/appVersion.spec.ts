import { describe, expect, it } from 'vitest';
import { TEST_BADGE_CLEARANCE_CLASS } from '@/features/settings/TestDeploymentBadge';
import {
  isNonProductionDeployment,
  shortGitSha,
  testBadgeLabel,
} from './appVersion';

describe('appVersion helpers', () => {
  it('shortens a full git sha', () => {
    expect(shortGitSha('abcdef0123456789')).toBe('abcdef0');
  });

  it('keeps unknown as unknown', () => {
    expect(shortGitSha('unknown')).toBe('unknown');
  });

  it('treats only production as production', () => {
    expect(isNonProductionDeployment('production')).toBe(false);
    expect(isNonProductionDeployment('test')).toBe(true);
  });

  it('formats the TEST badge label', () => {
    expect(testBadgeLabel({ version: '0.1.0', gitSha: 'deadbeefcafe' })).toBe(
      'TEST · 0.1.0 · deadbee',
    );
  });

  it('clears the fixed TEST chip with top padding and the safe area (BM-07)', () => {
    expect(TEST_BADGE_CLEARANCE_CLASS.startsWith('pt-')).toBe(true);
    expect(TEST_BADGE_CLEARANCE_CLASS).toContain('safe-area-inset-top');
  });
});
