import { RateVisibility } from '@ekum/domain-types';

export type PublishSheetPolicy = {
  rateVisibility: string;
  allowForward: boolean;
  allowDownload: boolean;
};

export type SellAsUsual = {
  unit: string;
  piecesPerPack: string;
  moq: string;
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
  allowDownload: false,
};

const EMPTY_SELL_AS: SellAsUsual = {
  unit: '',
  piecesPerPack: '',
  moq: '',
};

/** Quiet company usual from settings.tradeDefaults.publishDefaults. */
export function readCompanyPublishDefaults(
  tradeDefaults: Record<string, unknown> | null | undefined,
): PublishSheetPolicy {
  const publish = tradeDefaults?.publishDefaults;
  if (!publish || typeof publish !== 'object' || Array.isArray(publish)) {
    return { ...PLATFORM };
  }
  const blob = publish as {
    rateVisibility?: unknown;
    allowForward?: unknown;
    allowDownload?: unknown;
  };
  return {
    rateVisibility:
      blob.rateVisibility === RateVisibility.Visible ||
      blob.rateVisibility === RateVisibility.OnRequest
        ? blob.rateVisibility
        : PLATFORM.rateVisibility,
    allowForward: blob.allowForward !== false,
    allowDownload: blob.allowDownload === true,
  };
}

/** Usual sell-as for new designs from settings.tradeDefaults.sellAsUsual (not rate/notes). */
export function readCompanySellAsUsual(
  tradeDefaults: Record<string, unknown> | null | undefined,
): SellAsUsual {
  const raw = tradeDefaults?.sellAsUsual;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_SELL_AS };
  }
  const blob = raw as Record<string, unknown>;
  return {
    unit: typeof blob.unit === 'string' ? blob.unit : '',
    piecesPerPack:
      typeof blob.piecesPerPack === 'string'
        ? blob.piecesPerPack
        : typeof blob.piecesPerPack === 'number' && blob.piecesPerPack > 0
          ? String(blob.piecesPerPack)
          : '',
    moq:
      typeof blob.moq === 'string'
        ? blob.moq
        : typeof blob.moq === 'number' && blob.moq > 0
          ? String(blob.moq)
          : '',
  };
}

/** Yard↔metre (etc.) conversions from settings.tradeDefaults.unitConversions. */
export type UnitConversionRow = { from: string; to: string; factor: string };

export function readUnitConversions(
  tradeDefaults: Record<string, unknown> | null | undefined,
): UnitConversionRow[] {
  const raw = tradeDefaults?.unitConversions;
  if (!Array.isArray(raw)) return [];
  const rows: UnitConversionRow[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const blob = entry as Record<string, unknown>;
    const from = typeof blob.from === 'string' ? blob.from.trim() : '';
    const to = typeof blob.to === 'string' ? blob.to.trim() : '';
    const factor =
      typeof blob.factor === 'string'
        ? blob.factor.trim()
        : typeof blob.factor === 'number' && Number.isFinite(blob.factor)
          ? String(blob.factor)
          : '';
    if (!from || !to || !factor) continue;
    rows.push({ from, to, factor });
  }
  return rows;
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
    allowDownload: usual.allowDownload,
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
    allowDownload: usual.allowDownload,
  };
  const usedStrictestMerge = resolved.some(
    (r) =>
      r.rateVisibility !== policy.rateVisibility || r.allowForward !== policy.allowForward,
  );
  return { policy, usedStrictestMerge };
}
