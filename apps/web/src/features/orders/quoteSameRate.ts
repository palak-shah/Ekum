/** Apply one wholesale rate string to every line id (skips empty when clearing). */
export function ratesWithSharedValue(
  lineIds: string[],
  sharedRate: string,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const id of lineIds) {
    next[id] = sharedRate;
  }
  return next;
}

export type QuoteRateMode = 'same' | 'each';
