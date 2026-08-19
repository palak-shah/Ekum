import { BadRequestException } from '@nestjs/common';

const AUDIENCE_RANK: Record<string, number> = {
  selected: 0,
  connections: 1,
  followers: 2,
  everyone: 3,
};

export type CuratableProduct = {
  id: string;
  companyId: string;
  audience: string;
  allowForward: boolean;
  status: string;
  postedToMarketAt: Date | string | null;
};

export type AssertProductsCuratableInput = {
  curatorCompanyId: string;
  products: CuratableProduct[];
  publishAudience?: string;
  /** When provided, each foreign product id must be in this set (caller runs discoverability). */
  discoverableIds?: Set<string>;
};

export function audienceRank(audience: string): number {
  const rank = AUDIENCE_RANK[audience];
  if (rank === undefined) {
    throw new BadRequestException({
      code: 'INVALID_PRODUCTS',
      message: 'Invalid audience.',
    });
  }
  return rank;
}

function isForeign(curatorCompanyId: string, product: CuratableProduct): boolean {
  return product.companyId !== curatorCompanyId;
}

export function assertProductsCuratable(input: AssertProductsCuratableInput): void {
  const { curatorCompanyId, products, publishAudience, discoverableIds } = input;

  for (const product of products) {
    if (!isForeign(curatorCompanyId, product)) {
      continue;
    }

    if (!product.allowForward) {
      throw new BadRequestException({
        code: 'FORWARD_NOT_ALLOWED',
        message: "This seller doesn't allow sharing.",
      });
    }

    if (discoverableIds !== undefined && !discoverableIds.has(product.id)) {
      throw new BadRequestException({
        code: 'NOT_DISCOVERABLE',
        message: 'One or more products are not visible to you.',
      });
    }
  }

  if (publishAudience === undefined) {
    return;
  }

  const publishRank = audienceRank(publishAudience);
  let minForeignRank: number | null = null;

  for (const product of products) {
    if (!isForeign(curatorCompanyId, product)) {
      continue;
    }
    const rank = audienceRank(product.audience);
    minForeignRank = minForeignRank === null ? rank : Math.min(minForeignRank, rank);
  }

  if (minForeignRank !== null && publishRank > minForeignRank) {
    throw new BadRequestException({
      code: 'CURATED_AUDIENCE_TOO_WIDE',
      message: 'Publish audience is wider than a sourced design allows.',
    });
  }
}
