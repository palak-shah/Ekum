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
  /** Product ids with a ProductRelistGrant for the curator (Slice B). */
  relistGrantedIds?: Set<string>;
  /**
   * Foreign owners with allowed look follow — cannot curate (Connection does not unlock).
   * Everyone + allowForward (or grant) still skips FOLLOW_LOOK_ONLY.
   */
  lookOnlyOwnerIds?: Set<string>;
  /** When Reposting a pack, use the source collection audience for look-only exemption. */
  sourcePackAudience?: string;
  /**
   * Already-live curated pack (settings / rates / who republish).
   * Skip Pack/Look/discoverability re-litigation for members already on the child;
   * still enforce publish audience ceiling.
   */
  skipAddEligibility?: boolean;
};

function skipsLookOnlyBlock(
  product: CuratableProduct,
  granted: boolean,
  sourcePackAudience?: string,
): boolean {
  const audience = sourcePackAudience ?? product.audience;
  return audience === 'everyone' && (product.allowForward || granted);
}

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
  const {
    curatorCompanyId,
    products,
    publishAudience,
    discoverableIds,
    relistGrantedIds,
    lookOnlyOwnerIds,
    sourcePackAudience,
    skipAddEligibility = false,
  } = input;

  if (!skipAddEligibility) {
    for (const product of products) {
      if (!isForeign(curatorCompanyId, product)) {
        continue;
      }

      const granted = relistGrantedIds?.has(product.id) === true;

      if (
        lookOnlyOwnerIds?.has(product.companyId) === true &&
        !skipsLookOnlyBlock(product, granted, sourcePackAudience)
      ) {
        throw new BadRequestException({
          code: 'FOLLOW_LOOK_ONLY',
          message: "They haven't allowed putting their designs in a collection.",
        });
      }

      if (!product.allowForward && !granted) {
        throw new BadRequestException({
          code: 'RELIST_NOT_ALLOWED',
          message: "This seller doesn't allow putting this in a collection.",
        });
      }

      if (discoverableIds !== undefined && !discoverableIds.has(product.id)) {
        throw new BadRequestException({
          code: 'NOT_DISCOVERABLE',
          message: 'One or more products are not visible to you.',
        });
      }
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

export type RateVisibilityProduct = {
  companyId: string;
  rateVisibility?: string | null;
};

/**
 * Curated pack rate ceiling.
 *
 * Trader-owned selling quote (calc mode Same/Edit/Margin): honor the curator's
 * requested Visible / On request. Mill Product.rateVisibility must not force the
 * pack back to On request — Same/Margin/editOwnBase still refuse to leak
 * undisclosed mill ₹ in the resolver.
 *
 * Without calc mode (legacy / pass-through): keep Slice A — Visible only when
 * every foreign source allows visible rates.
 */
/**
 * Allow download cannot exceed foreign members (and optional immediate source pack).
 * Own-only packs: requested as-is.
 */
export function curatedPublishAllowDownload(input: {
  curatorCompanyId: string;
  requested: boolean;
  products: Array<{ companyId: string; allowDownload?: boolean | null }>;
  /** Immediate upstream pack allowDownload when reposting a collection. */
  sourcePackAllowDownload?: boolean | null;
}): boolean {
  if (!input.requested) return false;
  if (input.sourcePackAllowDownload === false) return false;
  const foreign = input.products.filter(
    (product) => product.companyId !== input.curatorCompanyId,
  );
  if (foreign.length === 0) return true;
  return foreign.every((product) => product.allowDownload === true);
}

/**
 * Allow Repost cannot exceed the immediate source pack.
 * Own-only / no source: requested as-is (true unless explicitly false).
 */
export function curatedPublishAllowForward(input: {
  requested: boolean;
  /** Immediate upstream pack allowForward when reposting a collection. */
  sourcePackAllowForward?: boolean | null;
}): boolean {
  if (!input.requested) return false;
  if (input.sourcePackAllowForward === false) return false;
  return true;
}

export function curatedPublishRateVisibility(input: {
  curatorCompanyId: string;
  requested: string;
  products: RateVisibilityProduct[];
  /** Pack has Same / Edit / Margin — trader owns selling-quote disclosure. */
  calcPricingMode?: string | null;
}): string {
  const requested =
    input.requested === 'visible' || input.requested === 'on_request'
      ? input.requested
      : 'on_request';
  const calc =
    input.calcPricingMode === 'same' ||
    input.calcPricingMode === 'edit' ||
    input.calcPricingMode === 'margin_fixed' ||
    input.calcPricingMode === 'margin_percent';
  if (calc) {
    return requested;
  }
  const foreign = input.products.filter((product) => product.companyId !== input.curatorCompanyId);
  if (foreign.length === 0) {
    return requested;
  }
  const allSourcesVisible = foreign.every((product) => product.rateVisibility === 'visible');
  if (allSourcesVisible && requested === 'visible') {
    return 'visible';
  }
  return 'on_request';
}
