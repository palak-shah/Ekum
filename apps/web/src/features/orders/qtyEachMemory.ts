/** v2 drops the old platform default of 20 that was auto-persisted into v1 keys. */
export function qtyEachMemoryKey(sellerId: string) {
  return `ekum:qty-each:v2:${sellerId || 'multi'}`;
}

export function readRememberedQty(sellerId: string): number | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(qtyEachMemoryKey(sellerId));
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function rememberQty(sellerId: string, qty: number) {
  if (!sellerId || typeof localStorage === 'undefined') return;
  if (!Number.isFinite(qty) || qty <= 0) return;
  try {
    localStorage.setItem(qtyEachMemoryKey(sellerId), String(qty));
  } catch {
    // ignore
  }
}

export function rememberedQtyLabel(qty: number | null | undefined): string {
  return qty != null && qty > 0 ? String(qty) : '';
}
