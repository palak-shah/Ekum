import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType, ZodTypeDef } from 'zod';

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
        message: 'The request could not be processed.',
        details: result.error.flatten(),
      });
    }
    return result.data;
  }
}
