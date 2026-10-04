import { describe, expect, it } from 'vitest';
import {
  messageReplyShouldTrigger,
  messageReplySwipeAxis,
  messageReplySwipeReveal,
} from './messageBubbleSwipe';

describe('messageBubbleSwipe', () => {
  it('locks horizontal once the finger has a clear direction', () => {
    expect(messageReplySwipeAxis(2, 2)).toBeNull();
    expect(messageReplySwipeAxis(20, 4)).toBe('x');
    expect(messageReplySwipeAxis(4, 20)).toBe('y');
  });

  it('triggers Reply after a rightward swipe past the threshold', () => {
    expect(messageReplySwipeReveal(-40)).toBe(0);
    expect(messageReplySwipeReveal(40)).toBe(40);
    expect(messageReplyShouldTrigger(40)).toBe(false);
    expect(messageReplyShouldTrigger(56)).toBe(true);
  });
});
