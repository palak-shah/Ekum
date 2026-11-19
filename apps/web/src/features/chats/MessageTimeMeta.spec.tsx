import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageTimeMeta, messageClockTime } from './MessageTimeMeta';

describe('MessageTimeMeta', () => {
  it('shows Sent grey single tick', () => {
    render(
      <MessageTimeMeta
        createdAt={new Date().toISOString()}
        tick="sent"
        testId="t"
      />,
    );
    expect(screen.getByTestId('chat-sent')).toHaveAttribute('aria-label', 'Sent');
  });

  it('shows Delivered grey double tick', () => {
    render(
      <MessageTimeMeta
        createdAt={new Date().toISOString()}
        tick="delivered"
        testId="t"
      />,
    );
    expect(screen.getByTestId('chat-delivered')).toHaveAttribute('aria-label', 'Delivered');
  });

  it('shows Seen blue double tick', () => {
    render(
      <MessageTimeMeta
        createdAt={new Date().toISOString()}
        tick="seen"
        testId="t"
      />,
    );
    expect(screen.getByTestId('chat-seen')).toHaveAttribute('aria-label', 'Seen');
  });

  it('omits ticks when none', () => {
    render(<MessageTimeMeta createdAt={new Date().toISOString()} testId="t" />);
    expect(screen.queryByTestId('chat-sent')).toBeNull();
    expect(screen.queryByTestId('chat-seen')).toBeNull();
  });

  it('formats clock as HH:mm', () => {
    const createdAt = '2026-09-23T14:05:00.000Z';
    expect(messageClockTime(createdAt)).toMatch(/^\d{2}:\d{2}$/);
  });
});
