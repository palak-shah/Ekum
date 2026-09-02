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
    CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
    DATABASE_URL: z.string().min(1),
    // Secrets must have real entropy; a weak secret makes JWT forgery practical.
    JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('10y'),
    // When true (never in production), the OTP is returned in the API response to
    // ease local testing. Off by default so a misconfigured deploy cannot leak it.
    OTP_EXPOSE_DEV_CODE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    // Web push (VAPID). Optional: when unset, push delivery is disabled and the
    // in-app notification feed still works. Set all three to enable browser push.
    WEB_PUSH_PUBLIC_KEY: z.string().optional(),
    WEB_PUSH_PRIVATE_KEY: z.string().optional(),
    WEB_PUSH_SUBJECT: z.string().default('mailto:ops@ekum.app'),
    // Media storage (Azure Blob). Optional: when the account/key are unset we fall
    // back to a local dev storage adapter that mints stub upload URLs, so the media
    // flow works end-to-end without cloud credentials.
    AZURE_STORAGE_ACCOUNT: z.string().optional(),
    AZURE_STORAGE_KEY: z.string().optional(),
    AZURE_STORAGE_CONTAINER: z.string().default('media'),
    // Where uploaded bytes are readable. Azure derives this from the account; the
    // dev adapter serves from here. Also used to build thumbnail URLs.
    PUBLIC_MEDIA_BASE_URL: z.string().default('http://localhost:3000/media'),
    // How long an upload ticket (SAS) stays valid.
    MEDIA_UPLOAD_TTL: z.string().default('10m'),
    // The buyer's window to raise a return after delivery.
    RETURN_WINDOW_DAYS: z.coerce.number().int().nonnegative().default(7),
    // Background job runner. Disable in environments that should not process jobs
    // (e.g. a read replica). The runner never starts under NODE_ENV=test.
    JOBS_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    JOBS_POLL_MS: z.coerce.number().int().positive().default(15000),
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
