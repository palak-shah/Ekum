import { CollectionStatus, PublishAudience } from '@ekum/domain-types';

export type CollectionSummaryInput = {
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
  audience?: string;
  audienceCompanyIds?: string[];
  audienceGroupIds?: string[];
};

export type BuyerGroupName = {
  id: string;
  name: string;
};

export type CollectionStatusPhase =
  | 'draft'
  | 'scheduled'
  | 'live'
  | 'archived'
  | 'other';

export type CollectionStatusSummary = {
  /** Single WhatsApp-style subtitle: phase · who · when */
  line: string;
  whoLabel: string | null;
  scheduleLabel: string | null;
  phase: CollectionStatusPhase;
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function daysUntil(iso: string, now: Date): number {
  const ms = new Date(iso).getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** Who can see this pack — plain trader words; group names when known. */
export function whoCanSeeLabel(
  collection: CollectionSummaryInput,
  groups: BuyerGroupName[] = [],
): string | null {
  const audience = collection.audience;
  if (!audience) return null;
  if (audience === PublishAudience.Everyone) return 'Everyone';
  if (audience === PublishAudience.Connections) return 'My connections';
  if (audience === PublishAudience.Followers) return 'My followers';
  if (audience !== PublishAudience.Selected) return audience;

  const groupIds = collection.audienceGroupIds ?? [];
  if (groupIds.length > 0) {
    const names = groupIds
      .map((id) => groups.find((g) => g.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    if (names.length === 1) return names[0]!;
    if (names.length > 1) return `${names[0]!} + ${names.length - 1} more`;
    if (groupIds.length === 1) return '1 group';
    return `${groupIds.length} groups`;
  }

  const n = collection.audienceCompanyIds?.length ?? 0;
  if (n === 1) return '1 business';
  if (n > 1) return `${n} businesses`;
  return 'Selected buyers';
}

function scheduleForPublished(
  collection: CollectionSummaryInput,
  now: Date,
): { phase: CollectionStatusPhase; phaseLabel: string; scheduleLabel: string | null } {
  const startsAt = collection.startsAt ? new Date(collection.startsAt) : null;
  const endsAt = collection.endsAt ? new Date(collection.endsAt) : null;

  if (startsAt && startsAt.getTime() > now.getTime()) {
    return {
      phase: 'scheduled',
      phaseLabel: `Starts ${formatShortDate(collection.startsAt!)}`,
      scheduleLabel: null,
    };
  }

  if (endsAt && endsAt.getTime() < now.getTime()) {
    return {
      phase: 'draft',
      phaseLabel: 'Draft',
      scheduleLabel: null,
    };
  }

  // No end date = live indefinitely; omit schedule label until scheduling ships.
  let scheduleLabel: string | null = null;
  if (endsAt && collection.endsAt) {
    const days = daysUntil(collection.endsAt, now);
    scheduleLabel =
      days <= 7 && days >= 0
        ? `Ends in ${days}d`
        : `Ends ${formatShortDate(collection.endsAt)}`;
  }

  return { phase: 'live', phaseLabel: 'Live', scheduleLabel };
}

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' · ');
}

/** One-line current truth for My Catalog tiles and collection Edit. */
export function collectionStatusSummary(
  collection: CollectionSummaryInput,
  groups: BuyerGroupName[] = [],
  now: Date = new Date(),
): CollectionStatusSummary {
  if (collection.status === CollectionStatus.Draft || collection.status === CollectionStatus.Ready) {
    return {
      line: 'Draft',
      whoLabel: null,
      scheduleLabel: null,
      phase: 'draft',
    };
  }
  if (collection.status === CollectionStatus.Archived) {
    return {
      line: 'Archived',
      whoLabel: null,
      scheduleLabel: null,
      phase: 'archived',
    };
  }
  if (collection.status !== CollectionStatus.Published) {
    return {
      line: collection.status,
      whoLabel: null,
      scheduleLabel: null,
      phase: 'other',
    };
  }

  const whoLabel = whoCanSeeLabel(collection, groups);
  const { phase, phaseLabel, scheduleLabel } = scheduleForPublished(collection, now);

  if (phase === 'draft') {
    return {
      line: 'Draft',
      whoLabel: null,
      scheduleLabel: null,
      phase: 'draft',
    };
  }

  if (phase === 'scheduled') {
    return {
      line: joinParts([phaseLabel, whoLabel]),
      whoLabel,
      scheduleLabel: null,
      phase,
    };
  }

  return {
    line: joinParts(['Published', whoLabel, scheduleLabel]),
    whoLabel,
    scheduleLabel,
    phase,
  };
}
