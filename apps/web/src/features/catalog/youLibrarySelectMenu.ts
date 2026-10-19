import { useLayoutEffect, useRef } from 'react';

export type YouLibrarySelectMenuState = {
  selecting: boolean;
  /** Collections select: Draft / Publish / Archive. Idle keeps Archived · Bookmarks. */
  canDraft: boolean;
  canPublish: boolean;
  canArchive: boolean;
  onDraft: () => void;
  onPublish: () => void;
  onArchive: () => void;
} | null;

let state: YouLibrarySelectMenuState = null;
const listeners = new Set<() => void>();

function emit() {
  for (const notify of listeners) notify();
}

export function getYouLibrarySelectMenu(): YouLibrarySelectMenuState {
  return state;
}

export function subscribeYouLibrarySelectMenu(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function setYouLibrarySelectMenu(next: YouLibrarySelectMenuState): void {
  state = next;
  emit();
}

/** Publish select-mode actions for the shell page ⋯. */
export function useYouLibrarySelectMenu(input: {
  selecting: boolean;
  canDraft: boolean;
  canPublish: boolean;
  canArchive: boolean;
  onDraft: () => void;
  onPublish: () => void;
  onArchive: () => void;
}): void {
  const onDraft = useRef(input.onDraft);
  const onPublish = useRef(input.onPublish);
  const onArchive = useRef(input.onArchive);
  onDraft.current = input.onDraft;
  onPublish.current = input.onPublish;
  onArchive.current = input.onArchive;

  useLayoutEffect(() => {
    if (!input.selecting) {
      setYouLibrarySelectMenu(null);
      return () => setYouLibrarySelectMenu(null);
    }
    setYouLibrarySelectMenu({
      selecting: true,
      canDraft: input.canDraft,
      canPublish: input.canPublish,
      canArchive: input.canArchive,
      onDraft: () => onDraft.current(),
      onPublish: () => onPublish.current(),
      onArchive: () => onArchive.current(),
    });
    return () => setYouLibrarySelectMenu(null);
  }, [input.selecting, input.canDraft, input.canPublish, input.canArchive]);
}
