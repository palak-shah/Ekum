import { canRelistFlag } from './forwardGate';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';

export function partitionRelistableDesigns(entries: BrowseShortlistEntry[]) {
  const allowed: BrowseShortlistEntry[] = [];
  const locked: BrowseShortlistEntry[] = [];
  for (const entry of entries) {
    if (canRelistFlag(entry.allowForward)) allowed.push(entry);
    else locked.push(entry);
  }
  return { allowed, locked };
}

/** Albums that can enter Curate resolve (pack / Pick designs). */
export function partitionRelistableAlbums(entries: BrowseAlbumEntry[]) {
  const allowed: BrowseAlbumEntry[] = [];
  const locked: BrowseAlbumEntry[] = [];
  for (const entry of entries) {
    if (canRelistFlag(entry.allowForward)) allowed.push(entry);
    else locked.push(entry);
  }
  return { allowed, locked };
}

export function curateLockedSkipMessage(lockedCount: number): string {
  if (lockedCount === 1) return '1 locked — seller doesn’t allow pack';
  return `${lockedCount} locked — seller doesn’t allow pack`;
}

export function curateDefaultPackName(input: {
  expandedAlbumNames: string[];
  allowedDesignNames: string[];
}): string {
  if (input.expandedAlbumNames.length === 1) {
    return input.expandedAlbumNames[0]!.trim();
  }
  if (input.expandedAlbumNames.length === 0 && input.allowedDesignNames.length === 1) {
    return input.allowedDesignNames[0]!.trim();
  }
  return '';
}

/** Pack-lock gray reason (separate from discovery unavailable). */
export function packLockReason(allowForward?: boolean): string | undefined {
  if (allowForward === false) return "Can't put in a pack";
  return undefined;
}
