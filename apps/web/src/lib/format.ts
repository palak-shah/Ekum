const UNIT_LABEL: Record<string, string> = {
  pc: 'pc',
  set: 'set',
  mtr: 'mtr',
  than: 'than',
  dozen: 'dozen',
  kg: 'kg',
  box: 'box',
};

/** Rate + unit, honouring the "on request" default when no rate is set. */
export function formatRate(
  rate: number | null,
  unit: string | null,
  rateMax: number | null = null,
): string {
  if (rate === null || rate === undefined) {
    return 'On request';
  }
  const low = `₹${rate.toLocaleString('en-IN')}`;
  const price =
    rateMax != null && rateMax > rate
      ? `${low}–₹${rateMax.toLocaleString('en-IN')}`
      : low;
  return unit ? `${price}/${UNIT_LABEL[unit] ?? unit}` : price;
}

export function formatUnit(unit: string | null): string {
  if (!unit) {
    return '';
  }
  return UNIT_LABEL[unit] ?? unit;
}

/** Compact file size for chat Document cards (WhatsApp-like). */
export function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${Math.max(1, Math.round(bytes))} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** Compact, human relative time ("2h", "3d", "just now"). */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) {
    return 'just now';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
