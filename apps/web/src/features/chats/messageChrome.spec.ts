import { describe, expect, it } from 'vitest';
import { MSG_BUBBLE_CLASS, messageChromeBubblePad } from './messageChrome';

describe('messageChromeBubblePad', () => {
  it('targets painted bubbles, not direct children only', () => {
    expect(messageChromeBubblePad(false)).toBeUndefined();
    expect(messageChromeBubblePad(true)).toBe(`[&_.${MSG_BUBBLE_CLASS}]:pr-8`);
  });
});
