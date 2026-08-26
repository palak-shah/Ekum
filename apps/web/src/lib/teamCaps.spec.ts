import { describe, expect, it } from 'vitest';
import { canTeamCap } from './teamCaps';
import type { OwnCompanyProfile } from '@ekum/domain-types';

const staffProfile = {
  permissions: {
    uploads: false,
    chats: true,
    orders: true,
    payments: false,
    team: false,
  },
} as OwnCompanyProfile;

describe('canTeamCap', () => {
  it('allows owner defaults when permissions missing', () => {
    expect(canTeamCap(null, 'uploads')).toBe(true);
  });

  it('respects staff caps', () => {
    expect(canTeamCap(staffProfile, 'uploads')).toBe(false);
    expect(canTeamCap(staffProfile, 'chats')).toBe(true);
    expect(canTeamCap(staffProfile, 'orders')).toBe(true);
  });
});
