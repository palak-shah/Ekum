/** Ink & Lime story ring: lime + charcoal conic. Never tangerine. */
export const EXPLORE_STORY_RING_IDLE_CLASS =
  'rounded-full p-[3px] bg-[conic-gradient(var(--ekum-badge),var(--ekum-accent),var(--ekum-badge))]';

export const EXPLORE_STORY_RING_ACTIVE_CLASS = 'rounded-full p-[3px] bg-accent';

export function exploreStoryRingClass(active: boolean): string {
  return active ? EXPLORE_STORY_RING_ACTIVE_CLASS : EXPLORE_STORY_RING_IDLE_CLASS;
}
