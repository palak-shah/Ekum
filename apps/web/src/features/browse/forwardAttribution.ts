/**
 * Option A: one rule — order goes to catalog owner; chat sharer stays in the loop.
 * Attribution stamps + sticky memory while browsing an album opened from chat.
 */

export function resolveForwardFacilitator(input: {
  senderCompanyId: string | null | undefined;
  viewerCompanyId: string | null | undefined;
  ownerCompanyId: string | null | undefined;
}): string | undefined {
  const sender = input.senderCompanyId?.trim();
  if (!sender) return undefined;
  if (input.viewerCompanyId && sender === input.viewerCompanyId) return undefined;
  if (input.ownerCompanyId && sender === input.ownerCompanyId) return undefined;
  return sender;
}

export function withFacilitatorQuery(
  path: string,
  facilitatorCompanyId: string | undefined,
): string {
  if (!facilitatorCompanyId) return path;
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}facilitator=${encodeURIComponent(facilitatorCompanyId)}`;
}

export function parseOrderPath(
  value: string | null | undefined,
): 'direct' | 'handle' | undefined {
  if (value === 'handle' || value === 'direct') return value;
  return undefined;
}

export function withOrderPathQuery(
  path: string,
  orderPath: 'direct' | 'handle' | undefined,
): string {
  if (!orderPath) return path;
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}path=${encodeURIComponent(orderPath)}`;
}

const PATH_MEMORY = 'ekum.orderPathByCatalog';

function readPathMemory(): Record<string, string> {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(PATH_MEMORY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function rememberOrderPath(
  catalogKind: 'collection' | 'product',
  catalogId: string,
  orderPath: 'direct' | 'handle',
): void {
  if (typeof sessionStorage === 'undefined' || !catalogId) return;
  try {
    const next = { ...readPathMemory(), [`${catalogKind}:${catalogId}`]: orderPath };
    sessionStorage.setItem(PATH_MEMORY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** Query stamp first, then session sticky. */
export function resolveOrderPathForCatalog(input: {
  catalogKind: 'collection' | 'product';
  catalogId: string;
  queryPath: string | null | undefined;
}): 'direct' | 'handle' | undefined {
  const fromQuery = parseOrderPath(input.queryPath);
  if (fromQuery) {
    rememberOrderPath(input.catalogKind, input.catalogId, fromQuery);
    return fromQuery;
  }
  return parseOrderPath(readPathMemory()[`${input.catalogKind}:${input.catalogId}`]);
}

const HANDLER_NAME_MEMORY = 'ekum.handlerNameByCatalog';

export function rememberCatalogHandlerName(
  catalogKind: 'collection' | 'product',
  catalogId: string,
  name: string,
): void {
  if (typeof sessionStorage === 'undefined' || !catalogId || !name.trim()) return;
  try {
    const next = { ...readHandlerNameMemory(), [`${catalogKind}:${catalogId}`]: name.trim() };
    sessionStorage.setItem(HANDLER_NAME_MEMORY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function readHandlerNameMemory(): Record<string, string> {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(HANDLER_NAME_MEMORY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function readCatalogHandlerName(
  catalogKind: 'collection' | 'product',
  catalogId: string,
): string | undefined {
  if (!catalogId) return undefined;
  return readHandlerNameMemory()[`${catalogKind}:${catalogId}`];
}

/** Who the buyer’s ticket is with — handle = sharer, Direct = design owner. */
export function catalogOrderGoesToLine(input: {
  path: 'direct' | 'handle' | undefined;
  ownerName: string | null | undefined;
  handlerName: string | null | undefined;
  mine?: boolean;
}): string | null {
  const owner = input.ownerName?.trim();
  if (input.path === 'handle') {
    if (input.mine) return 'Order goes to you';
    const handler = input.handlerName?.trim();
    if (handler) return `Order goes to ${handler}`;
  }
  return owner ? `Order goes to ${owner}` : null;
}

/** Chat label: own catalog share vs forward of someone else's. */
export function catalogShareSenderLabel(input: {
  mine: boolean;
  senderLabel: string;
  ownerCompanyId: string | null | undefined;
  senderCompanyId: string | null | undefined;
}): string {
  const owner = input.ownerCompanyId?.trim();
  const sender = input.senderCompanyId?.trim();
  const isForward = Boolean(owner && sender && owner !== sender);
  if (input.mine) return isForward ? `${input.senderLabel} forwarded` : input.senderLabel;
  if (isForward) return `${input.senderLabel} forwarded`;
  return input.senderLabel;
}

const FACILITATOR_MEMORY = 'ekum.forwardFacilitatorByCatalog';

type FacilitatorMemory = Record<string, string>;

function readMemory(): FacilitatorMemory {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(FACILITATOR_MEMORY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as FacilitatorMemory;
  } catch {
    return {};
  }
}

export function rememberForwardFacilitator(
  catalogKind: 'collection' | 'product',
  catalogId: string,
  facilitatorCompanyId: string,
): void {
  if (typeof sessionStorage === 'undefined' || !catalogId || !facilitatorCompanyId) return;
  try {
    const next = { ...readMemory(), [`${catalogKind}:${catalogId}`]: facilitatorCompanyId };
    sessionStorage.setItem(FACILITATOR_MEMORY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function readRememberedFacilitator(
  catalogKind: 'collection' | 'product',
  catalogId: string,
): string | undefined {
  if (!catalogId) return undefined;
  return readMemory()[`${catalogKind}:${catalogId}`];
}

/** Resolve facilitator from URL first, then session sticky for this catalog. */
export function resolveFacilitatorForCatalog(input: {
  catalogKind: 'collection' | 'product';
  catalogId: string;
  queryFacilitator: string | null | undefined;
}): string | undefined {
  const fromQuery = input.queryFacilitator?.trim();
  if (fromQuery) {
    rememberForwardFacilitator(input.catalogKind, input.catalogId, fromQuery);
    return fromQuery;
  }
  return readRememberedFacilitator(input.catalogKind, input.catalogId);
}

export function orderViewerIsFacilitator(
  order: {
    buyerCompanyId: string;
    sellerCompanyId: string;
    facilitatorCompanyId: string | null;
  },
  companyId: string | null | undefined,
): boolean {
  if (!companyId || !order.facilitatorCompanyId) return false;
  return (
    order.facilitatorCompanyId === companyId &&
    order.buyerCompanyId !== companyId &&
    order.sellerCompanyId !== companyId
  );
}
