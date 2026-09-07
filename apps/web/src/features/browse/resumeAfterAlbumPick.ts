export const RESUME_AFTER_ALBUM_PICK_KEY = 'ekum:resumeAfterAlbumPick';

export type ResumeAfterAlbumPick = 'curate' | 'order';

export type AlbumPickContinueStep =
  | { kind: 'next-album'; collectionId: string }
  | { kind: 'finish'; resume: ResumeAfterAlbumPick };

function canUseStorage(): boolean {
  return typeof sessionStorage !== 'undefined';
}

export function writeResumeAfterAlbumPick(value: ResumeAfterAlbumPick): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(RESUME_AFTER_ALBUM_PICK_KEY, value);
}

export function readResumeAfterAlbumPick(): ResumeAfterAlbumPick | null {
  if (!canUseStorage()) return null;
  const raw = sessionStorage.getItem(RESUME_AFTER_ALBUM_PICK_KEY);
  if (raw === 'curate' || raw === 'order') return raw;
  return null;
}

export function clearResumeAfterAlbumPick(): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(RESUME_AFTER_ALBUM_PICK_KEY);
}

/** Remaining albums in pick after the current “Pick designs” album was removed. */
export function nextStepAfterAlbumPick(input: {
  resume: ResumeAfterAlbumPick | null;
  remainingAlbumIds: string[];
}): AlbumPickContinueStep | null {
  if (!input.resume) return null;
  const nextId = input.remainingAlbumIds[0];
  if (nextId) return { kind: 'next-album', collectionId: nextId };
  return { kind: 'finish', resume: input.resume };
}

export function continueAfterAlbumPickLabel(
  resume: ResumeAfterAlbumPick,
  remainingAlbumCount: number,
): string {
  if (remainingAlbumCount > 0) {
    return remainingAlbumCount === 1
      ? 'Next collection'
      : `Next collection (${remainingAlbumCount})`;
  }
  return resume === 'curate' ? 'Continue Curate' : 'Continue Order';
}
