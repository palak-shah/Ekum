import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** Deterministic keyed hash for values we must store but never keep in plaintext. */
export function hmacHash(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

/** A high-entropy, URL-safe opaque token (used for refresh tokens). */
export function randomToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/** A numeric OTP code of the given length. */
export function generateOtpCode(length = 4): string {
  const max = 10 ** length;
  return randomInt(0, max)
    .toString()
    .padStart(length, '0');
}

/** Constant-time string comparison to avoid timing side channels. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

/** Parses durations like "15m", "30d", "1h", "45s", "10y" into milliseconds. Years = 365 days. */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)([smhdy])$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${input}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    y: 365 * 86_400_000,
  };
  return amount * multipliers[unit as keyof typeof multipliers];
}
