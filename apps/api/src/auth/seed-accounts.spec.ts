import { describe, expect, it } from 'vitest';
import { actingUserId, preferredSeedCompanyId, seedUserIdForPhone } from './seed-accounts';

describe('seed-accounts', () => {
  it('maps QA last-10s to seed people', () => {
    expect(seedUserIdForPhone('+919800000001')).toBe('seed-user-ravi');
    expect(seedUserIdForPhone('919800000001')).toBe('seed-user-ravi');
    expect(seedUserIdForPhone('9800000002')).toBe('seed-user-meena');
  });

  it('rewrites leftover token subjects for demo phones', () => {
    expect(actingUserId('919800000001', 'leftover-amit')).toBe('seed-user-ravi');
    expect(actingUserId('+919800000099', 'u1')).toBe('u1');
  });

  it('prefers the seed shop for each seed person', () => {
    expect(preferredSeedCompanyId('seed-user-ravi')).toBe('seed-company-ravi');
    expect(preferredSeedCompanyId('seed-user-ravi-staff')).toBe('seed-company-ravi');
  });
});
