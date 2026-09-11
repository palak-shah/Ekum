import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatTradeCard } from './ChatTradeCardView';
import type { ChatTradeCardModel } from './chatTradeCard';

function model(overrides: Partial<ChatTradeCardModel> = {}): ChatTradeCardModel {
  return {
    kind: 'quote',
    primary: 'Order #MGYF · Quote',
    who: 'Surat Silk House',
    details: ['₹20,000'],
    thumbs: [],
    createdAt: new Date().toISOString(),
    mine: false,
    variant: 'bubble',
    noteVoiceUrl: 'https://example.com/q.webm',
    noteVoiceDurationMs: 1500,
    ...overrides,
  };
}

describe('ChatTradeCard voice note', () => {
  it('shows the mic player on the rich quote bubble', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard model={model({ variant: 'bubble' })} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('voice-play')).toBeInTheDocument();
  });

  it('shows the mic player on compact pulses that still carry quote voice', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard model={model({ variant: 'pulse' })} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('voice-play')).toBeInTheDocument();
  });

  it('makes quote amounts stronger than supporting detail lines', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            details: ['₹2,83,800', '9 designs · 20 pcs each'],
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const amount = screen.getByText('₹2,83,800');
    expect(amount.className).toMatch(/font-semibold/);
    expect(amount.className).toMatch(/text-\[15px\]/);
  });
});

describe('ChatTradeCard direction surface rule', () => {
  it('incoming bubble: light surface + teal rail (not solid accent fill)', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: false,
            kind: 'order',
            primary: 'Order #FS3C · Inquiry',
            action: { label: 'View inquiry →', to: '/orders/1', style: 'link' },
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('chat-trade-card');
    expect(card).toHaveAttribute('data-mine', 'false');
    expect(card.className).toMatch(/bg-surface/);
    expect(card.className).toMatch(/border-l-accent/);
    expect(card.className).not.toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(screen.getByText('View inquiry →').className).toMatch(/text-accent/);
  });

  it('outgoing bubble: solid Ekum teal + white View link (status does not change fill)', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: true,
            kind: 'order',
            primary: 'Order #FS3C · Dispatched',
            action: { label: 'View order →', to: '/orders/1', style: 'link' },
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('chat-trade-card');
    expect(card).toHaveAttribute('data-mine', 'true');
    expect(card.className).toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(card.className).not.toMatch(/bg-surface/);
    expect(screen.getByText('View order →').className).toMatch(/text-white/);
  });

  it('outgoing pulse (Dispatched) still uses solid teal — status is not a pale fill', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: true,
            kind: 'order',
            variant: 'pulse',
            primary: 'Order #FS3C · Dispatched',
            action: { label: 'View order →', to: '/orders/1', style: 'link' },
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('chat-trade-card-pulse');
    expect(card.className).toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(card.className).not.toMatch(/bg-surface/);
    expect(screen.getByText('View order →').className).toMatch(/text-white/);
  });

  it('outgoing Accepted pulse forces solid teal fill (inline) + white View order', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: true,
            kind: 'order',
            variant: 'pulse',
            primary: 'Order #6AMX Accepted',
            details: ['3 designs'],
            action: { label: 'View order →', onClick: () => undefined, style: 'link' },
            noteVoiceUrl: null,
          })}
          onOpen={() => undefined}
        />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('chat-trade-card-pulse');
    expect(card.tagName).toBe('DIV');
    expect(card.style.backgroundColor).toBe('rgb(15, 107, 112)');
    expect(card.className).toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    const link = screen.getByText('View order →');
    expect(link).toHaveStyle({ color: '#ffffff' });
  });

  it('outgoing quote Accept CTA contrasts on teal fill', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: true,
            kind: 'quote',
            primary: 'Order #MGYF · Quote',
            action: { label: 'Accept quote', onClick: () => undefined, style: 'primary' },
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const accept = screen.getByText('Accept quote');
    expect(accept.className).toMatch(/bg-surface/);
    expect(accept.className).toMatch(/text-ink/);
  });

  it('incoming bubble and pulse share the same white + teal-rail surface', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: false,
            kind: 'order',
            variant: 'bubble',
            primary: 'Order #W3WH · Requested',
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const bubble = screen.getByTestId('chat-trade-card');
    expect(bubble.className).toMatch(/bg-surface/);
    expect(bubble.className).toMatch(/border-l-accent/);

    rerender(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: false,
            kind: 'order',
            variant: 'pulse',
            primary: 'Order #AEYR · Dispatched',
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const pulse = screen.getByTestId('chat-trade-card-pulse');
    expect(pulse.className).toMatch(/bg-surface/);
    expect(pulse.className).toMatch(/border-l-accent/);
    expect(pulse.className).not.toMatch(/bg-foam|bg-kind-order/);
  });

  it('incoming quote Accept CTA stays solid accent on light card', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            mine: false,
            kind: 'quote',
            primary: 'Order #MGYF · Quote',
            action: { label: 'Accept quote', onClick: () => undefined, style: 'primary' },
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    const accept = screen.getByText('Accept quote');
    expect(accept.className).toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(accept.className).toMatch(/text-white/);
  });
});
