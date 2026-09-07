/**
 * Soft-hide helpers for I-handle Manage parents.
 * Upstream mill identity must never appear on the buyer↔trader ticket surfaces.
 */

/** True when `text` contains any upstream shop name (case-insensitive, whole-name). */
export function textLeaksUpstreamName(
  text: string | null | undefined,
  upstreamNames: string[],
): boolean {
  if (!text?.trim() || upstreamNames.length === 0) return false;
  const lower = text.toLowerCase();
  return upstreamNames.some((name) => {
    const n = name.trim().toLowerCase();
    return n.length > 0 && lower.includes(n);
  });
}

/**
 * Replace leaked mill names in shared copy. If the whole string was mill-attributed,
 * use `fallback` (e.g. "Confirmed" or "Surat Silk House confirmed").
 */
export function scrubUpstreamNames(
  text: string | null | undefined,
  upstreamNames: string[],
  fallback: string,
): string | null {
  if (text == null) return null;
  if (!textLeaksUpstreamName(text, upstreamNames)) return text;
  let next = text;
  for (const name of upstreamNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    next = next.replace(new RegExp(escapeRegExp(trimmed), 'gi'), '').replace(/\s+/g, ' ').trim();
  }
  // " confirmed" / "dispatched part" left after stripping the shop → prefer clean fallback
  if (!next || /^(confirmed|dispatched|part shipped)\b/i.test(next)) {
    return fallback;
  }
  if (textLeaksUpstreamName(next, upstreamNames)) return fallback;
  return next || fallback;
}

export function buyerSafePassThroughSummary(
  kind: 'confirmed' | 'dispatched' | 'part_shipped',
  traderName: string,
): string {
  const who = traderName.trim() || 'Seller';
  if (kind === 'confirmed') return `${who} confirmed`;
  if (kind === 'part_shipped') return `${who} dispatched part`;
  return `${who} dispatched`;
}

/**
 * Body/preview on a Manage parent order card must only name ticket parties.
 * If the line attributes a third shop (mill), rewrite to the trader (seller).
 */
export function scrubForeignPartyOrderBody(
  body: string | null | undefined,
  buyerName: string | null | undefined,
  sellerName: string | null | undefined,
): string | null {
  if (body == null) return null;
  const parties = [buyerName, sellerName]
    .map((n) => n?.trim())
    .filter((n): n is string => Boolean(n));
  if (parties.length === 0) return body;
  const lower = body.toLowerCase();
  const namesParty = parties.some((p) => lower.includes(p.toLowerCase()));
  if (namesParty) return body;
  const seller = sellerName?.trim() || 'Seller';
  if (/\bdispatched part\b/i.test(body) || /\bpart shipped\b/i.test(body)) {
    return buyerSafePassThroughSummary('part_shipped', seller);
  }
  if (/\bdispatched\b/i.test(body)) {
    return buyerSafePassThroughSummary('dispatched', seller);
  }
  if (/\bconfirmed\b/i.test(body)) {
    return buyerSafePassThroughSummary('confirmed', seller);
  }
  return body;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Scrub order/rate message body when it names a non-party shop. */
export function scrubOrderMessageView<
  T extends {
    body: string | null;
    reference?: {
      kind?: string;
      buyerName?: string | null;
      sellerName?: string | null;
    } | null;
  },
>(view: T): T {
  const ref = view.reference;
  if (!ref || (ref.kind !== 'order' && ref.kind !== 'rate')) return view;
  const body = scrubForeignPartyOrderBody(view.body, ref.buyerName, ref.sellerName);
  if (body === view.body) return view;
  return { ...view, body };
}
