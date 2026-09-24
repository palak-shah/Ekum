/** Persist a renamed group. Empty keeps the last name. */
export function commitGroupTitle(raw: string, previous: string): string | null {
  const next = raw.trim().slice(0, 120);
  const last = previous.trim();
  if (!next || next === last) return null;
  return next;
}

/** Persist the one-line. Empty clears it. Same text is a no-op. */
export function commitGroupBlurb(raw: string, previous: string): string | null | undefined {
  const next = raw.trim().slice(0, 80);
  const last = previous.trim();
  if (next === last) return undefined;
  return next || null;
}
