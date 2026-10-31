/** Calendar day key in the viewer's local timezone. */
export function calendarDayKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** WhatsApp-style date chip: Today · Yesterday · 11 Oct · 11 Oct 2025. */
export function threadDateChipLabel(iso: string, now = new Date()): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const delta = startOfLocalDay(now) - startOfLocalDay(d);
  if (delta === 0) return 'Today';
  if (delta === dayMs) return 'Yesterday';
  const month = d.toLocaleDateString('en-IN', { month: 'short' });
  const day = d.getDate();
  if (d.getFullYear() === now.getFullYear()) return `${day} ${month}`;
  return `${day} ${month} ${d.getFullYear()}`;
}

/** Label when `current` is on a different calendar day than `previous` (or is first). */
export function threadDateChip(
  previousIso: string | null | undefined,
  currentIso: string,
  now = new Date(),
): string | null {
  const currentKey = calendarDayKey(currentIso);
  if (!currentKey) return null;
  if (previousIso) {
    const prevKey = calendarDayKey(previousIso);
    if (prevKey === currentKey) return null;
  }
  return threadDateChipLabel(currentIso, now);
}
