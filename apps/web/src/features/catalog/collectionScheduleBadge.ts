import { CollectionStatus } from '@ekum/domain-types';
import {
  collectionStatusSummary,
  whoCanSeeLabel,
  type CollectionSummaryInput,
} from './collectionStatusSummary';

export type CollectionBadgeInput = CollectionSummaryInput;

export type CollectionBadge = {
  /** Primary: Draft / Starts… / Live / Archived */
  primary: string;
  /** Secondary: Ends… when Live and an end date is set */
  secondary: string | null;
};

/** @deprecated Prefer collectionStatusSummary — kept for filters / transitional callers. */
export function collectionScheduleBadge(
  collection: CollectionBadgeInput,
  now: Date = new Date(),
): CollectionBadge {
  const summary = collectionStatusSummary(collection, [], now);
  if (collection.status === CollectionStatus.Draft || collection.status === CollectionStatus.Ready) {
    return { primary: 'Draft', secondary: null };
  }
  if (collection.status === CollectionStatus.Archived) {
    return { primary: 'Archived', secondary: null };
  }
  if (summary.phase === 'scheduled') {
    return { primary: summary.line.split(' · ')[0] ?? summary.line, secondary: null };
  }
  if (summary.phase === 'live') {
    return { primary: 'Live', secondary: summary.scheduleLabel };
  }
  if (summary.phase === 'draft') {
    return { primary: 'Draft', secondary: null };
  }
  return { primary: summary.line, secondary: null };
}

/** @deprecated Prefer whoCanSeeLabel from collectionStatusSummary. */
export function audienceLabel(audience: string | undefined): string | null {
  return whoCanSeeLabel({ status: CollectionStatus.Published, audience });
}

export {
  collectionStatusSummary,
  whoCanSeeLabel,
} from './collectionStatusSummary';
export type {
  BuyerGroupName,
  CollectionStatusSummary,
  CollectionSummaryInput,
} from './collectionStatusSummary';
