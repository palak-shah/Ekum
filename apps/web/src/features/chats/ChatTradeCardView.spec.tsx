import { describe, expect, it, vi } from 'vitest';
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
    expect(document.querySelector('audio')).toBeNull();
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
  it('incoming bubble: chat-in surface + accent rail (not solid accent fill)', () => {
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
    expect(card.className).toMatch(/bg-chat-in/);
    expect(card.className).toMatch(/border-l-accent/);
    expect(card.className).not.toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(screen.getByText('View inquiry →').className).toMatch(/text-accent/);
  });

  it('outgoing bubble: chat-out green + accent View link (not solid accent)', () => {
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
    expect(card.className).toMatch(/bg-chat-out/);
    expect(card.className).not.toMatch(/bg-chat-in/);
    expect(card.className).not.toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(screen.getByText('View order →').className).toMatch(/text-accent/);
  });

  it('outgoing pulse uses chat-out — status is not a solid accent fill', () => {
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
    expect(card.className).toMatch(/bg-chat-out/);
    expect(card.className).not.toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(screen.getByText('View order →').className).toMatch(/text-accent/);
  });

  it('outgoing Accepted pulse paints chat-out via CSS var + accent View order', () => {
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
    expect(card.style.backgroundColor).toBe('var(--ekum-chat-out)');
    expect(card.className).toMatch(/bg-chat-out/);
    const link = screen.getByText('View order →');
    expect(link).toHaveStyle({ color: 'var(--ekum-accent)' });
  });

  it('outgoing quote Accept CTA is solid accent on light card', () => {
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
    expect(accept.className).toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
    expect(accept.className).toMatch(/text-white/);
  });

  it('incoming bubble and pulse share the same chat-in + accent-rail surface', () => {
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
    expect(bubble.className).toMatch(/bg-chat-in/);
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
    expect(pulse.className).toMatch(/bg-chat-in/);
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

describe('ChatTradeCard section order', () => {
  it('orders header → images → note → actions; omits note when empty', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            kind: 'order',
            primary: 'Order #1005 · Placed',
            details: ['3 sets'],
            thumbs: ['https://img/a.jpg', 'https://img/b.jpg'],
            note: 'Please pack tight',
            noteVoiceUrl: null,
            action: { label: 'View order →', to: '/orders/1', style: 'link' },
          })}
        />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('chat-trade-card');
    const header = screen.getByTestId('chat-trade-card-header');
    const images = screen.getByTestId('chat-trade-card-images');
    const note = screen.getByTestId('chat-trade-card-note');
    const actions = screen.getByTestId('chat-trade-card-actions');
    expect(header.compareDocumentPosition(images) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(images.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(note.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(card.textContent).toContain('Please pack tight');
  });

  it('omits the note band when there is no user message', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            kind: 'order',
            thumbs: ['https://img/a.jpg'],
            note: '',
            noteVoiceUrl: null,
            action: { label: 'View order →', to: '/orders/1', style: 'link' },
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('chat-trade-card-note')).toBeNull();
    expect(screen.getByTestId('chat-trade-card-header')).toBeInTheDocument();
    expect(screen.getByTestId('chat-trade-card-images')).toBeInTheDocument();
    expect(screen.getByTestId('chat-trade-card-actions')).toBeInTheDocument();
  });

  it('puts time at card-edge right-1 under the chevron; dividers bleed past chevron pad', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            kind: 'collection',
            primary: 'Ethnic collection',
            details: [],
            thumbs: ['https://img/a.jpg', 'https://img/b.jpg'],
            note: 'hi',
            noteVoiceUrl: null,
            action: { label: 'View collection →', to: '/collections/1', style: 'link' },
          })}
        />
      </MemoryRouter>,
    );
    const header = screen.getByTestId('chat-trade-card-header');
    const note = screen.getByTestId('chat-trade-card-note');
    const time = screen.getByTestId('chat-trade-card-time');
    const actions = screen.getByTestId('chat-trade-card-actions');
    expect(note.contains(time)).toBe(true);
    expect(time.className).toMatch(/absolute/);
    expect(time.className).toMatch(/right-3/);
    // Cancel MessageChrome bubble pr-8 so rules / time reach the painted edge.
    for (const el of [header, note, actions]) {
      expect(el.className).toMatch(/-mr-8/);
    }
    expect(header.className).toMatch(/border-b/);
    expect(actions.className).toMatch(/border-t/);
    expect(note.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('full-width divider above View action; without note, time sits above the action band', () => {
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            kind: 'designs',
            primary: '2 designs',
            who: 'You forwarded',
            thumbs: ['https://img/a.jpg', 'https://img/b.jpg'],
            note: '',
            noteVoiceUrl: null,
            action: { label: 'View designs →', to: '/designs/set?ids=a,b', style: 'link' },
          })}
        />
      </MemoryRouter>,
    );
    const images = screen.getByTestId('chat-trade-card-images');
    const actions = screen.getByTestId('chat-trade-card-actions');
    const time = screen.getByTestId('chat-trade-card-time');
    const view = screen.getByText('View designs →');

    // Divider lives on the actions band (edge-to-edge), not under the thumb collage.
    expect(images.className).not.toMatch(/border-b/);
    expect(actions.className).toMatch(/-mr-8/);
    expect(actions.className).toMatch(/border-t/);
    expect(view.className).not.toMatch(/border-t/);

    // Time is above View designs — never inside the action band.
    expect(actions.contains(time)).toBe(false);
    expect(actions.contains(view)).toBe(true);
    expect(time.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(time.className).toMatch(/text-right/);
  });
});

describe('ChatTradeCard designs', () => {
  it('collage tap opens the set page, not PhotoViewer', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const onOpen = vi.fn();
    render(
      <MemoryRouter>
        <ChatTradeCard
          onOpen={onOpen}
          model={model({
            kind: 'designs',
            primary: '17 designs',
            thumbs: ['https://img/a.jpg', 'https://img/b.jpg'],
            noteVoiceUrl: null,
            action: { label: 'View designs →', to: '/designs/set?ids=a,b', style: 'link' },
          })}
        />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('photo-album-thumb'));
    expect(onOpen).toHaveBeenCalled();
    expect(screen.queryByTestId('photo-viewer')).toBeNull();
  });
});

describe('ChatTradeCard complaint', () => {
  it('shows More and opens the photo viewer on tap', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(
      <MemoryRouter>
        <ChatTradeCard
          model={model({
            kind: 'complaint',
            primary: 'Late lot',
            details: ['Navy satin · 29 Sep'],
            note: 'Qty short',
            thumbs: ['https://img/a.jpg', 'https://img/navy.jpg'],
            thumbCaptions: [null, 'Navy satin'],
            noteVoiceUrl: null,
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Qty short')).toBeInTheDocument();
    expect(screen.getByText('Navy satin · 29 Sep')).toBeInTheDocument();
    await user.click(screen.getByTestId('chat-trade-card'));
    expect(screen.getByTestId('photo-viewer')).toBeInTheDocument();
  });
});
