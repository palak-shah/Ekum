import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodError, ZodType, ZodTypeDef } from 'zod';

/** Shown to traders — never Zod stock text or field-path jargon. */
export const VALIDATION_USER_MESSAGE =
  'Something doesn’t look right. Check what you entered and try again.';

/**
 * Prefer a short human sentence from the schema when present; otherwise the
 * default. Skips Zod noise ("Required", "Expected …") and developer field names.
 */
export function userFacingValidationMessage(error: ZodError): string {
  const flat = error.flatten();
  const candidates = [
    ...flat.formErrors,
    ...Object.values(flat.fieldErrors).flatMap((msgs) => msgs ?? []),
  ];
  for (const raw of candidates) {
    const msg = raw?.trim();
    if (!msg) continue;
    if (/^Required$/i.test(msg)) continue;
    if (/^Expected\b/i.test(msg)) continue;
    if (/^Invalid\b/i.test(msg)) continue;
    if (/\b(productId|sellerCompanyId|orderItemId|companyId|mediaId)\b/i.test(msg)) {
      continue;
    }
    // Custom schema copy should already be a trader sentence.
    if (msg.length >= 12 && /[a-z]/.test(msg)) return msg;
  }
  return VALIDATION_USER_MESSAGE;
}

/**
 * Validates a request payload against a shared zod schema from
 * @ekum/domain-types, keeping structural validation at the controller boundary
 * and preventing the API and web app from drifting on valid values. The input
 * type is intentionally `unknown` so schemas with `.default()`/`.coerce` (where
 * parsed output differs from raw input, e.g. paginated query strings) are accepted.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: userFacingValidationMessage(result.error),
        // Keep flatten for logs / support — UI shows `message` only.
        details: result.error.flatten(),
      });
    }
    return result.data;
  }
}
