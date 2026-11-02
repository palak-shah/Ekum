import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderTicketNotes } from './OrderTicketNotes';
import type { OrderTicketNote } from './orderTicketChrome';

vi.mock('@/features/voice/NoteAttachField', () => ({
  NoteAttachField: () => <div data-testid="note-attach-stub" />,
}));

function note(partial: Partial<OrderTicketNote> & Pick<OrderTicketNote, 'id' | 'note'>): OrderTicketNote {
  return {
    who: 'Surat Silk House',
    mine: false,
    at: '2026-09-08T00:00:00.000Z',
    noteVoiceUrl: null,
    noteVoiceDurationMs: null,
    noteImageUrls: [],
    forwarded: false,
    cue: null,
    ...partial,
  };
}

const idle = {
  canForward: false,
  note: '',
  onNoteChange: vi.fn(),
  voice: null,
  onVoiceChange: vi.fn(),
  images: [] as string[],
  onImagesChange: vi.fn(),
  onAdd: vi.fn(),
  adding: false,
  error: null,
  onForward: vi.fn(),
  forwarding: false,
  millPickOpen: false,
  millPickMills: [] as Array<{ orderId: string; name: string }>,
  onPickMill: vi.fn(),
  onCloseMillPick: vi.fn(),
  onOpenNotePhotos: vi.fn(),
};

describe('OrderTicketNotes', () => {
  it('washes You as chat-out and them as foam', () => {
    render(
      <OrderTicketNotes
        {...idle}
        notes={[
          note({ id: 'them', note: 'Will cut Friday', mine: false }),
          note({ id: 'you', note: 'Thanks', who: 'You', mine: true }),
        ]}
      />,
    );
    expect(screen.getByText('Will cut Friday').closest('[data-testid="order-ticket-note"]')).toHaveClass(
      'bg-foam',
    );
    expect(screen.getByText('Thanks').closest('[data-testid="order-ticket-note"]')).toHaveClass(
      'bg-chat-out',
    );
  });

  it('caps at the newest 3 and reveals earlier notes behind N more notes', () => {
    render(
      <OrderTicketNotes
        {...idle}
        notes={[
          note({ id: 'n1', note: 'Place lining', at: '2026-09-01T00:00:00.000Z' }),
          note({ id: 'n2', note: 'Will cut Friday', at: '2026-09-02T00:00:00.000Z' }),
          note({ id: 'n3', note: 'Need extra lining', at: '2026-09-03T00:00:00.000Z', mine: true }),
          note({ id: 'n4', note: 'Packed', at: '2026-09-04T00:00:00.000Z' }),
        ]}
      />,
    );
    expect(screen.getByTestId('order-notes-more')).toHaveTextContent('1 more note');
    expect(screen.queryByText('Place lining')).toBeNull();
    expect(screen.getByText('Packed')).toBeTruthy();
    fireEvent.click(screen.getByTestId('order-notes-more'));
    expect(screen.getByText('Place lining')).toBeTruthy();
    expect(screen.getByTestId('order-notes-more')).toHaveTextContent('View less');
  });
});
