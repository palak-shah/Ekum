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

/** Confirm needs ≥1 tick and qty ≥ 1 on each. Rate is optional. */
export function decideLinesConfirmReady(
  itemIds: string[],
  actions: Record<string, DecideLineAction>,
  qtyById: Record<string, string>,
  lineQtyById: Record<string, number>,
): boolean {
  let confirming = 0;
  for (const id of itemIds) {
    if (actions[id] === 'decline') continue;
    confirming += 1;
    const typed = qtyById[id];
    const qty =
      typed != null && typed.trim() !== '' ? Number(typed) : (lineQtyById[id] ?? 0);
    if (!Number.isFinite(qty) || qty < 1) return false;
  }
  return confirming >= 1;
}

/** Resolve confirm qty: keep line qty if blank/invalid; min 1 — no buyer-ask cap. */
export function resolveDecideConfirmQty(
  raw: string | undefined,
  lineQty: number,
): number {
  const fallback = Math.max(1, lineQty);
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

/** Apply one qty to every confirmable line. */
export function qtysWithSharedValue(
  lineIds: string[],
  sharedQty: string,
  defaults: Record<string, string> = {},
): Record<string, string> {
  const next: Record<string, string> = {};
  const useDefault = !sharedQty.trim();
  for (const id of lineIds) {
    next[id] = useDefault ? (defaults[id] ?? '') : sharedQty;
  }
  return next;
}

export function decideLinesPayload(
  itemIds: string[],
  actions: Record<string, DecideLineAction>,
  verb: DecideLineAction,
  qtyById?: Record<string, string>,
  lineQtyById?: Record<string, number>,
  rateById?: Record<string, string>,
  resolveRate?: (raw: string | undefined) => number | null,
): Array<{
  orderItemId: string;
  action: DecideLineAction;
  quantity?: number;
  rate?: number;
}> {
  if (verb === 'decline') {
    return itemIds.map((orderItemId) => ({ orderItemId, action: 'decline' }));
  }
  return itemIds.map((orderItemId) => {
    const action = actions[orderItemId] === 'decline' ? 'decline' : 'confirm';
    if (action === 'decline') {
      return { orderItemId, action };
    }
    const lineQty = lineQtyById?.[orderItemId] ?? 1;
    const quantity = resolveDecideConfirmQty(qtyById?.[orderItemId], lineQty);
    const rate = resolveRate?.(rateById?.[orderItemId]) ?? undefined;
    return {
      orderItemId,
      action,
      quantity,
      ...(rate != null ? { rate } : {}),
    };
  });
}

/** Manual + personal extras go on Confirm only — Decline all omits them. */
export function decideLinesConfirmExtras(
  verb: DecideLineAction,
  drafts: {
    manualOrderNo: string;
    manualImages: string[];
    personalNote: string;
    personalVoiceMediaId?: string;
    personalVoiceDurationMs?: number;
    personalImages: string[];
  },
): {
  manualOrderNo?: string | null;
  manualNoteImageUrls?: string[];
  personalNote?: string | null;
  personalNoteVoiceMediaId?: string | null;
  personalNoteVoiceDurationMs?: number | null;
  personalNoteImageUrls?: string[];
} {
  if (verb !== 'confirm') return {};
  return {
    manualOrderNo: drafts.manualOrderNo.trim() || null,
    manualNoteImageUrls: drafts.manualImages,
    personalNote: drafts.personalNote.trim() || null,
    personalNoteVoiceMediaId: drafts.personalVoiceMediaId ?? null,
    personalNoteVoiceDurationMs: drafts.personalVoiceDurationMs ?? null,
    personalNoteImageUrls: drafts.personalImages,
  };
}
