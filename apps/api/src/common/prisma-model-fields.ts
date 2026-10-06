import { Prisma } from '@prisma/client';

/** True when the generated client knows this scalar (stale generate omits new columns). */
export function prismaModelHasField(model: string, field: string): boolean {
  const row = Prisma.dmmf.datamodel.models.find((entry) => entry.name === model);
  return Boolean(row?.fields.some((item) => item.name === field));
}

export function withPrismaField<T extends Record<string, unknown>>(
  model: string,
  field: string,
  data: T,
  value: unknown,
): T {
  if (!prismaModelHasField(model, field)) return data;
  return { ...data, [field]: value };
}
