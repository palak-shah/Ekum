import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  VALIDATION_USER_MESSAGE,
  userFacingValidationMessage,
} from './zod-validation.pipe';

describe('userFacingValidationMessage', () => {
  it('uses the default for Zod stock Required noise', () => {
    const schema = z.object({ sellerCompanyId: z.string().min(1) });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(userFacingValidationMessage(result.error)).toBe(VALIDATION_USER_MESSAGE);
  });

  it('surfaces custom trader sentences from the schema', () => {
    const schema = z.object({}).superRefine((_v, ctx) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add at least one photo before sending.',
        path: ['items'],
      });
    });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(userFacingValidationMessage(result.error)).toBe(
      'Add at least one photo before sending.',
    );
  });

  it('skips messages that name developer field ids', () => {
    const schema = z.object({}).superRefine((_v, ctx) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Each standard order line needs a productId.',
        path: ['items', 0, 'productId'],
      });
    });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(userFacingValidationMessage(result.error)).toBe(VALIDATION_USER_MESSAGE);
  });

  it('surfaces photo image URL copy from createOrderSchema', async () => {
    const { createOrderSchema, OrderKind } = await import('@ekum/domain-types');
    const result = createOrderSchema.safeParse({
      sellerCompanyId: 'c1',
      kind: OrderKind.Photo,
      items: [{ name: 'Photo 1', quantity: 10, images: ['/media/not-absolute.jpg'] }],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(userFacingValidationMessage(result.error)).toBe(
      'Photo isn’t ready yet. Remove it and add it again.',
    );
  });
});
