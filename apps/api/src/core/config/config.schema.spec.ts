import { describe, expect, it } from 'vitest';
import { validateEnv } from './config.schema';

const base = {
  DATABASE_URL: 'postgresql://ekum:ekum@localhost:5432/ekum',
  JWT_ACCESS_SECRET: 'access-secret-that-is-long-enough-0123456789',
  JWT_REFRESH_SECRET: 'refresh-secret-that-is-long-enough-0123456789',
};

describe('validateEnv', () => {
  it('applies defaults for optional values', () => {
    const env = validateEnv(base);
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.JWT_ACCESS_TTL).toBe('15m');
    expect(env.JWT_REFRESH_TTL).toBe('10y');
    expect(env.OTP_EXPOSE_DEV_CODE).toBe(false);
  });

  it('coerces PORT to a number', () => {
    const env = validateEnv({ ...base, PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('parses OTP_EXPOSE_DEV_CODE into a boolean', () => {
    expect(validateEnv({ ...base, OTP_EXPOSE_DEV_CODE: 'true' }).OTP_EXPOSE_DEV_CODE).toBe(true);
  });

  it('throws when a required secret is missing', () => {
    expect(() => validateEnv({ DATABASE_URL: base.DATABASE_URL })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects weak JWT secrets', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('refuses to expose the OTP dev code in production', () => {
    expect(() =>
      validateEnv({ ...base, NODE_ENV: 'production', OTP_EXPOSE_DEV_CODE: 'true' }),
    ).toThrow(/Invalid environment configuration/);
  });
});
