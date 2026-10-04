import { BadRequestException } from '@nestjs/common';
import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';

/**
 * Parse schedule inputs from the wire (ISO datetime or YYYY-MM-DD).
 * Start → UTC start-of-day when date-only; end → UTC end-of-day when date-only.
 */
export function parseScheduleInstant(
  value: string | null | undefined,
  bound: 'start' | 'end',
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const m = Number(dateOnly[2]);
    const d = Number(dateOnly[3]);
    if (bound === 'start') {
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    }
    return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException({
      code: 'INVALID_SCHEDULE',
      message: 'Invalid schedule date.',
    });
  }
  return parsed;
}

export function assertValidLiveWindow(startsAt: Date | null, endsAt: Date | null): void {
  if (startsAt && endsAt && startsAt.getTime() >= endsAt.getTime()) {
    throw new BadRequestException({
      code: 'INVALID_SCHEDULE',
      message: 'Start must be before end.',
    });
  }
}

/** At least one Published member — empty / all-draft packs waste a follower tap. */
export function hasPublishedDesignClause(): Prisma.CollectionWhereInput {
  return { products: { some: { product: { status: ProductStatus.Published } } } };
}

export function collectionHasPublishedMember(
  products?: Array<{ product?: { status?: string } | null } | null> | null,
): boolean {
  return (products ?? []).some((row) => row?.product?.status === ProductStatus.Published);
}

/** Buyer-facing: published, inside the live window, and has a live design. */
export function isCollectionLiveForBuyers(
  collection: {
    status: string;
    startsAt?: Date | string | null;
    endsAt?: Date | string | null;
    products?: Array<{ product?: { status?: string } | null } | null> | null;
  },
  now: Date = new Date(),
): boolean {
  if (collection.status !== CollectionStatus.Published) return false;
  const startsAt = collection.startsAt ? new Date(collection.startsAt) : null;
  const endsAt = collection.endsAt ? new Date(collection.endsAt) : null;
  if (startsAt && startsAt.getTime() > now.getTime()) return false;
  if (endsAt && endsAt.getTime() < now.getTime()) return false;
  if (collection.products !== undefined && !collectionHasPublishedMember(collection.products)) {
    return false;
  }
  return true;
}

/** AND clauses: inside startsAt/endsAt window (for published rows). */
export function liveWindowClauses(now: Date = new Date()): Prisma.CollectionWhereInput[] {
  return [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
  ];
}

/** Prisma filter: published albums currently visible to buyers (time-gated). */
export function livePublishedCollectionWhere(
  now: Date = new Date(),
): Prisma.CollectionWhereInput {
  return {
    status: CollectionStatus.Published,
    AND: [...liveWindowClauses(now), hasPublishedDesignClause()],
  };
}
