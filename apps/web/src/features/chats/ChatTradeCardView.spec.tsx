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
});
