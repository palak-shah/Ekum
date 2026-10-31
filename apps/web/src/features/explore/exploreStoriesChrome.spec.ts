import { describe, expect, it } from 'vitest';
import {
  EXPLORE_STORY_RING_ACTIVE_CLASS,
  EXPLORE_STORY_RING_IDLE_CLASS,
  exploreStoryRingClass,
} from './exploreStoriesChrome';

describe('Explore story rings', () => {
  it('uses lime + charcoal conic, not tangerine', () => {
    expect(EXPLORE_STORY_RING_IDLE_CLASS).toContain('conic-gradient');
    expect(EXPLORE_STORY_RING_IDLE_CLASS).toContain('--ekum-badge');
    expect(EXPLORE_STORY_RING_IDLE_CLASS).toContain('--ekum-accent');
    expect(EXPLORE_STORY_RING_IDLE_CLASS).not.toMatch(/tangerine/);
    expect(exploreStoryRingClass(false)).not.toMatch(/tangerine/);
    expect(exploreStoryRingClass(true)).toBe(EXPLORE_STORY_RING_ACTIVE_CLASS);
    expect(EXPLORE_STORY_RING_ACTIVE_CLASS).toContain('bg-accent');
    expect(EXPLORE_STORY_RING_ACTIVE_CLASS).not.toMatch(/tangerine/);
  });
});
