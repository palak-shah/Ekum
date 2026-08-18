import { RateVisibility } from '@ekum/domain-types';

export type PublishSheetPolicy = {
  rateVisibility: string;
  allowForward: boolean;
};

export type GroupPublishFields = {
  id?: string;
  memberCompanyIds: string[];
  defaultRateVisibility: string | null;
  allowForward: boolean | null;
};

const PLATFORM: PublishSheetPolicy = {
  rateVisibility: RateVisibility.OnRequest,
  allowForward: true,
};

/** Quiet company usual from settings.tradeDefaults.publishDefaults. */
export function readCompanyPublishDefaults(
  tradeDefaults: Record<string, unknown> | null | undefined,
): PublishSheetPolicy {
  const publish = tradeDefaults?.publishDefaults;
  if (!publish || typeof publish !== 'object' || Array.isArray(publish)) {
    return { ...PLATFORM };
  }
  const blob = publish as { rateVisibility?: unknown; allowForward?: unknown };
  return {
    rateVisibility:
      blob.rateVisibility === RateVisibility.Visible ||
      blob.rateVisibility === RateVisibility.OnRequest
        ? blob.rateVisibility
        : PLATFORM.rateVisibility,
    allowForward: blob.allowForward !== false,
  };
}

/** Merge optional group override (null fields inherit). */
export function applyGroupPublishOverride(
  usual: PublishSheetPolicy,
  group: {
    defaultRateVisibility: string | null;
    allowForward: boolean | null;
  },
): PublishSheetPolicy {
  return {
    rateVisibility:
      group.defaultRateVisibility === RateVisibility.Visible ||
      group.defaultRateVisibility === RateVisibility.OnRequest
        ? group.defaultRateVisibility
        : usual.rateVisibility,
    allowForward:
      group.allowForward === null || group.allowForward === undefined
        ? usual.allowForward
        : group.allowForward,
  };
}

/** Unique company IDs across selected buyer groups. */
export function unionGroupMembers(groups: { memberCompanyIds: string[] }[]): string[] {
  const ids = new Set<string>();
  for (const group of groups) {
    for (const id of group.memberCompanyIds) {
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

/**
 * Resolve policy for one or more selected groups: start from company usual,
 * apply each group's override, then take strictest across results
 * (on_request beats visible; allowForward false beats true).
 */
export function mergeGroupsPublishPolicy(
  usual: PublishSheetPolicy,
  groups: GroupPublishFields[],
): { policy: PublishSheetPolicy; usedStrictestMerge: boolean } {
  if (groups.length === 0) {
    return { policy: { ...usual }, usedStrictestMerge: false };
  }
  if (groups.length === 1) {
    return {
      policy: applyGroupPublishOverride(usual, groups[0]!),
      usedStrictestMerge: false,
    };
  }
  const resolved = groups.map((group) => applyGroupPublishOverride(usual, group));
  const policy: PublishSheetPolicy = {
    rateVisibility: resolved.some((r) => r.rateVisibility === RateVisibility.OnRequest)
      ? RateVisibility.OnRequest
      : RateVisibility.Visible,
    allowForward: resolved.every((r) => r.allowForward),
  };
  const usedStrictestMerge = resolved.some(
    (r) =>
      r.rateVisibility !== policy.rateVisibility || r.allowForward !== policy.allowForward,
  );
  return { policy, usedStrictestMerge };
}
