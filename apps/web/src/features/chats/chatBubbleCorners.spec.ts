import { describe, expect, it } from 'vitest';
import { chatBubbleCorners } from './chatBubbleCorners';

describe('chatBubbleCorners', () => {
  it('uses a sharp bottom-right corner for outgoing', () => {
    const cls = chatBubbleCorners(true);
    expect(cls).toContain('rounded-br-sm');
    expect(cls).not.toContain('rounded-bl-sm');
    expect(cls).not.toMatch(/\brounded-2xl\b/);
  });

  it('uses a sharp bottom-left corner for incoming', () => {
    const cls = chatBubbleCorners(false);
    expect(cls).toContain('rounded-bl-sm');
    expect(cls).not.toContain('rounded-br-sm');
  });
});
