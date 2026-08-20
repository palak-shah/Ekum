/** Default note when requesting catalog access (connect). */

export const DEFAULT_ACCESS_REQUEST_NOTE =
  'Hi — I’d like to connect to see your rates and designs.';

/** Persist a usable note: trim; fall back to the default when empty. */
export function resolveAccessRequestNote(note: string): string {
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_ACCESS_REQUEST_NOTE;
}
