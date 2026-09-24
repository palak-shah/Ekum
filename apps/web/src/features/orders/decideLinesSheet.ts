export type DecideLineAction = 'confirm' | 'decline';

export function defaultLineActions(itemIds: string[]): Record<string, DecideLineAction> {
  const next: Record<string, DecideLineAction> = {};
  for (const id of itemIds) next[id] = 'confirm';
  return next;
}

export function decideLinesTally(
  itemIds: string[],
  actions: Record<string, DecideLineAction>,
): { confirm: number; decline: number } {
  let confirm = 0;
  let decline = 0;
  for (const id of itemIds) {
    if (actions[id] === 'decline') decline += 1;
    else confirm += 1;
  }
  return { confirm, decline };
}

export function decideLinesPayload(
  itemIds: string[],
  actions: Record<string, DecideLineAction>,
  verb: DecideLineAction,
): Array<{ orderItemId: string; action: DecideLineAction }> {
  if (verb === 'decline') {
    return itemIds.map((orderItemId) => ({ orderItemId, action: 'decline' }));
  }
  return itemIds.map((orderItemId) => ({
    orderItemId,
    action: actions[orderItemId] === 'decline' ? 'decline' : 'confirm',
  }));
}
