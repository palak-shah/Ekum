/** Pure shutter / Done rules for ContinuousCamera (BM: second open stuck). */
export function continuousCameraCanShoot(input: {
  ready: boolean;
  busy: boolean;
  maxShots: number;
  shotsTaken: number;
}): boolean {
  const remaining = Math.max(0, input.maxShots - input.shotsTaken);
  return input.ready && !input.busy && remaining > 0;
}

export function continuousCameraDoneEnabled(shotsTaken: number): boolean {
  return shotsTaken > 0;
}

/** New-design batches teach via outcome: Add N designs (not bare Done). */
export function continuousCameraDoneLabel(
  shotsTaken: number,
  batchAsDesigns?: boolean,
): string {
  if (!batchAsDesigns) return 'Done';
  if (shotsTaken <= 1) return 'Add design';
  return `Add ${shotsTaken} designs`;
}
