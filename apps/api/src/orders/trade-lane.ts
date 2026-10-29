/** TradeLane reveal On posts the mill subset to the trio only after Send. Main ticket never. */
export function shouldRouteToTrio(input: {
  reveal: boolean;
  millReleased: boolean;
}): boolean {
  return input.reveal && input.millReleased;
}

/**
 * Open chat on the Manage / Trading parent always uses buyer↔trader 1:1.
 * Mill trios live on millDesks[].revealThreadId — never steal parent.threadId
 * (first mill would win when 2+ reveal On).
 */
export function manageParentOpenChatThreadId(
  buyerSellerDirectThreadId: string | null,
  _firstMillRevealThreadId?: string | null,
): string | null {
  return buyerSellerDirectThreadId;
}

/** True when this order is a released mill hop (subset), not the Manage parent. */
export function isReleasedMillSubset(order: {
  downstreamOrderId: string | null | undefined;
  upstreamReleasedAt: Date | string | null | undefined;
}): boolean {
  return Boolean(order.downstreamOrderId && order.upstreamReleasedAt);
}

/** Lane ticket → place path. Missing lane = quiet first pair (I handle). */
export function effectivePathFromLane(ticket: string | null | undefined): 'handle' | 'direct' {
  return ticket === 'mill' ? 'direct' : 'handle';
}

/** Mill Direct Link for this buyer with mill/trader in either order. */
export function trioMillLaneWhere(
  companyA: string,
  companyB: string,
  buyerCompanyId: string,
): {
  ticket: 'mill';
  buyerCompanyId: string;
  OR: Array<{ traderCompanyId: string; sellerCompanyId: string }>;
} {
  return {
    ticket: 'mill',
    buyerCompanyId,
    OR: [
      { traderCompanyId: companyA, sellerCompanyId: companyB },
      { traderCompanyId: companyB, sellerCompanyId: companyA },
    ],
  };
}

export const DEFAULT_LANE_BEHAVIORS = {
  directOrder: true,
  /** Kept on the JSON model; auto-repost is not shipped. */
  autoRepost: false,
} as const;

/** Flip when Stage 6 ships — until then stored `true` must not look live. */
export const LANE_AUTOREPOST_AVAILABLE = false;

export function laneBehaviorsFromJson(
  raw: unknown,
): { directOrder: boolean; autoRepost: boolean } {
  const row =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return {
    directOrder: row.directOrder !== false,
    autoRepost: LANE_AUTOREPOST_AVAILABLE && row.autoRepost === true,
  };
}

/** Next Place: Direct mill ticket when ticket=mill and directOrder is on (default). */
export function laneRoutesDirect(input: {
  ticket?: string | null;
  behaviors?: unknown;
}): boolean {
  if (effectivePathFromLane(input.ticket) !== 'direct') return false;
  return laneBehaviorsFromJson(input.behaviors).directOrder;
}

export function qtyChangeSummary(before: number, after: number): string {
  return `Updated qty · ${before} → ${after}`;
}
