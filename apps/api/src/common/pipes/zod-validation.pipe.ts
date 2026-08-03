import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Validates a request payload against a shared zod schema from
 * @ekum/domain-types, keeping structural validation at the controller boundary
 * and preventing the API and web app from drifting on valid values.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

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
