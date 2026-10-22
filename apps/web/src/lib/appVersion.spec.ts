import { describe, expect, it } from 'vitest';
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
});
