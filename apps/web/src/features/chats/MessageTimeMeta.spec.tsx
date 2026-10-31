import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageTimeMeta, messageClockTime } from './MessageTimeMeta';

describe('MessageTimeMeta', () => {
  it('puts Seen ticks beside the time when the other shop has read', () => {
    render(
      <MessageTimeMeta
        createdAt={new Date(Date.now() - 60_000).toISOString()}
        seen
        testId="chat-trade-card-time"
      />,
    );
    const time = screen.getByTestId('chat-trade-card-time');
    const ticks = screen.getByTestId('chat-seen');
    expect(time.contains(ticks)).toBe(true);
    expect(ticks).toHaveAttribute('aria-label', 'Seen');
  });

  it('omits ticks when they have not read', () => {
    render(
      <MessageTimeMeta createdAt={new Date().toISOString()} testId="t" />,
    );
    expect(screen.queryByTestId('chat-seen')).toBeNull();
  });

  it('shows an HH:mm clock, not relative timeAgo', () => {
    const createdAt = new Date(2026, 9, 30, 16, 5).toISOString();
    render(<MessageTimeMeta createdAt={createdAt} testId="t" />);
    expect(screen.getByTestId('t').textContent).toContain(messageClockTime(createdAt));
    expect(screen.getByTestId('t').textContent).not.toMatch(/\d+h/);
  });
});
