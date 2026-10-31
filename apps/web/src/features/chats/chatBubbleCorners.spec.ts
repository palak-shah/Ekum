import { describe, expect, it } from 'vitest';
import { chatBubbleCorners } from './chatBubbleCorners';

describe('chatBubbleCorners', () => {
  it('uses a sharp bottom-right corner and tail class for outgoing last-of-run', () => {
    const cls = chatBubbleCorners(true);
    expect(cls).toContain('rounded-br-sm');
    expect(cls).toContain('ekum-msg-tail-out');
    expect(cls).not.toContain('rounded-bl-sm');
    expect(cls).not.toMatch(/\brounded-2xl\b/);
  });

  it('uses a sharp bottom-left corner and tail class for incoming last-of-run', () => {
    const cls = chatBubbleCorners(false);
    expect(cls).toContain('rounded-bl-sm');
    expect(cls).toContain('ekum-msg-tail-in');
    expect(cls).not.toContain('rounded-br-sm');
  });

  it('uses even rounding with no tail on earlier messages in a run', () => {
    const cls = chatBubbleCorners(true, { tail: false });
    expect(cls).toBe('rounded-2xl');
    expect(cls).not.toContain('ekum-msg-tail-out');
  });
});
