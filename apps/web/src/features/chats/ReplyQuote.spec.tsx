import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { REPLY_QUOTE_CLASS, ReplyQuote } from './ReplyQuote';

const preview = {
  id: 'living-1',
  type: 'order_card',
  bodyPreview: 'Order #15P1',
  available: true,
  photoUrl: null,
};

describe('ReplyQuote', () => {
  it('has no left accent bar', () => {
    expect(REPLY_QUOTE_CLASS).not.toMatch(/border-l/);
  });

  it('user reply names the quoted shop + preview', () => {
    render(<ReplyQuote preview={preview} mine={false} fromLabel="Surat Silk House" />);
    expect(screen.getByTestId('chat-reply-quote')).toBeTruthy();
    expect(screen.getByText('Surat Silk House')).toBeTruthy();
    expect(screen.queryByText('Reply')).toBeNull();
    expect(screen.getByText('Order #15P1')).toBeTruthy();
  });

  it('order tag shows Order # and omits Reply', () => {
    render(<ReplyQuote preview={preview} mine={false} orderTag />);
    expect(screen.getByTestId('chat-order-tag')).toBeTruthy();
    expect(screen.queryByText('Reply')).toBeNull();
    expect(screen.getByText('Order #15P1')).toBeTruthy();
  });
});
