import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { prismaModelHasField, withPrismaField } from './prisma-model-fields';

describe('prismaModelHasField', () => {
  it('knows Product.name', () => {
    expect(prismaModelHasField('Product', 'name')).toBe(true);
  });

  it('omits fields the generated client does not have', () => {
    const known = Prisma.dmmf.datamodel.models
      .find((m) => m.name === 'Product')
      ?.fields.some((f) => f.name === 'dispatchUnit');
    const data = withPrismaField('Product', 'dispatchUnit', { name: 'x' }, 'pc');
    if (known) {
      expect(data).toEqual({ name: 'x', dispatchUnit: 'pc' });
    } else {
      expect(data).toEqual({ name: 'x' });
    }
  });
});
