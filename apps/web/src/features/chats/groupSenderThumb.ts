/** Incoming group only — 1:1 wash already says who. */
export function reserveIncomingSenderThumb(input: {
  isGroup: boolean;
  incoming: boolean;
}): boolean {
  return input.isGroup && input.incoming;
}

/** Draw the shop avatar only on the last consecutive incoming from that shop. */
export function showGroupSenderThumb(input: {
  isGroup: boolean;
  incoming: boolean;
  clusterTail: boolean;
}): boolean {
  return input.isGroup && input.incoming && input.clusterTail;
}
