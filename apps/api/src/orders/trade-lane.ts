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
