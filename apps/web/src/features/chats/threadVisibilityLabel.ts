/** Inbox/header: business name only. No Team / Private word. */
export function threadVisibilityLabel(_thread: {
  type: string;
  visibility: string;
}): string | null {
  return null;
}

export function threadVisibilitySubtitle(
  visibilityLabel: string | null,
  city?: string | null,
): string | undefined {
  const place = city?.trim() || '';
  if (visibilityLabel && place) return `${place} · ${visibilityLabel}`;
  return visibilityLabel ?? (place || undefined);
}
