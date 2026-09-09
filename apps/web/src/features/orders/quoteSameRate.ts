/** Apply one wholesale rate to every line; blank shared rate restores defaults. */
export function ratesWithSharedValue(
  lineIds: string[],
  sharedRate: string,
  defaults: Record<string, string> = {},
): Record<string, string> {
  const next: Record<string, string> = {};
  const useDefault = !sharedRate.trim();
  for (const id of lineIds) {
    next[id] = useDefault ? (defaults[id] ?? '') : sharedRate;
  }
  return next;
}
