import { z } from 'zod';

/**
 * Environment schema. Validated at boot so a missing or malformed variable
 * fails startup immediately rather than at first use in production. All config
 * access should go through the typed ConfigService, never raw process.env.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    DATABASE_URL: z.string().min(1),
    // Secrets must have real entropy; a weak secret makes JWT forgery practical.
    JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('30d'),
    // When true (never in production), the OTP is returned in the API response to
    // ease local testing. Off by default so a misconfigured deploy cannot leak it.
    OTP_EXPOSE_DEV_CODE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .refine((env) => !(env.NODE_ENV === 'production' && env.OTP_EXPOSE_DEV_CODE), {
    message: 'OTP_EXPOSE_DEV_CODE must be false in production',
    path: ['OTP_EXPOSE_DEV_CODE'],
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
