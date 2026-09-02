/**
 * Express 5 `*path` used to land as a string[] that Node joined with commas
 * (`companyId,file.jpg` at the media root). Current GET uses slash segments
 * (`companyId/file.jpg`). Serve both so older uploads still resolve.
 */
export function mediaDiskCandidates(relative: string): string[] {
  const trimmed = relative.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  if (!trimmed || trimmed.includes('..')) {
    return [];
  }
  const comma = trimmed.replace(/\//g, ',');
  return comma === trimmed ? [trimmed] : [trimmed, comma];
}
