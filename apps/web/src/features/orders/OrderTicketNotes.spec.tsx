import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderTicketNotes } from './OrderTicketNotes';
import type { OrderTicketNote } from './orderTicketChrome';

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/mediaUpload', () => ({
  uploadImage: vi.fn(),
  uploadAudio: vi.fn(),
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
    forwardable: false,
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
  it('uses prototype Notes type (title weight, muted empty, slate body)', () => {
    const { rerender } = render(<OrderTicketNotes {...idle} notes={[]} />);
    expect(screen.getByText('Notes & comments')).toHaveClass('font-title');
    expect(screen.getByTestId('order-notes-audience')).toHaveClass('text-meta');
    expect(screen.getByText('No notes yet.')).toHaveClass('text-meta');

    rerender(
      <OrderTicketNotes
        {...idle}
        notes={[note({ id: 'them', note: 'Will cut Friday', mine: false })]}
      />,
    );
    const bubble = screen.getByTestId('order-ticket-note');
    expect(bubble).toHaveClass('text-slate');
    expect(screen.getByText('Will cut Friday')).toHaveClass('text-slate');
    expect(screen.getByText('Surat Silk House')).toHaveClass('font-title');
  });

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

  it('shows Forward only on place and noted when the ticket can forward', () => {
    render(
      <OrderTicketNotes
        {...idle}
        canForward
        notes={[
          note({ id: 'place', note: 'Need lining', forwardable: true }),
          note({
            id: 'c1',
            note: 'Will cut Friday',
            cue: 'On confirm',
            forwardable: false,
          }),
          note({ id: 'n1', note: 'Thanks', who: 'You', mine: true, forwardable: true }),
        ]}
      />,
    );
    expect(screen.getAllByTestId('order-note-forward')).toHaveLength(2);
    const confirmRow = screen.getByText('Will cut Friday').closest('[data-testid="order-ticket-note"]');
    expect(confirmRow?.querySelector('[data-testid="order-note-forward"]')).toBeNull();
  });

  it('hides Forward on forwarded notes and cues the trader to write a new one', () => {
    render(
      <OrderTicketNotes
        {...idle}
        canForward
        notes={[
          note({
            id: 'copied',
            note: 'Need lining on mill lot',
            who: 'You',
            mine: true,
            forwardable: true,
            forwarded: true,
          }),
        ]}
      />,
    );
    expect(screen.queryByTestId('order-note-forward')).toBeNull();
    expect(screen.getByTestId('order-note-forwarded')).toHaveTextContent('Forwarded');
    expect(screen.getByTestId('order-note-forwarded')).toHaveTextContent(
      'Write a new note to forward again',
    );
  });

  it('shows Forwarded without the write-new cue when the viewer cannot forward', () => {
    render(
      <OrderTicketNotes
        {...idle}
        canForward={false}
        notes={[
          note({
            id: 'copied',
            note: 'Need lining on mill lot',
            forwardable: true,
            forwarded: true,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId('order-note-forwarded')).toHaveTextContent('Forwarded');
    expect(screen.getByTestId('order-note-forwarded')).not.toHaveTextContent(
      'Write a new note to forward again',
    );
  });

  it('keeps Send visible but grayed until note/voice/photos are ready (BM-11)', () => {
    const { rerender } = render(<OrderTicketNotes {...idle} notes={[]} />);
    const idleSend = screen.getByTestId('order-ticket-note-send');
    expect(idleSend).toBeDisabled();
    expect(idleSend).toHaveClass('text-muted');
    expect(screen.queryByRole('button', { name: 'Add' })).toBeNull();
    expect(screen.queryByText('Add')).toBeNull();

    rerender(<OrderTicketNotes {...idle} notes={[]} note="Need lining" />);
    const send = screen.getByTestId('order-ticket-note-send');
    expect(send).toHaveAttribute('aria-label', 'Send');
    expect(send).not.toBeDisabled();
    expect(send).toHaveClass('bg-accent');
    expect(send).not.toHaveTextContent('Add');
  });

  it('shows Send when only photos are attached', () => {
    render(<OrderTicketNotes {...idle} notes={[]} images={['https://cdn.example/a.jpg']} />);
    expect(screen.getByTestId('order-ticket-note-send')).toBeInTheDocument();
  });

  it('Enter submits and Shift+Enter does not', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onNoteChange = vi.fn();
    render(
      <OrderTicketNotes
        {...idle}
        notes={[]}
        note="Need lining"
        onNoteChange={onNoteChange}
        onAdd={onAdd}
      />,
    );
    const input = screen.getByTestId('order-ticket-note-input');
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(onAdd).toHaveBeenCalledTimes(1);

    onAdd.mockClear();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('grows the composer above one line when the note wraps', () => {
    render(
      <OrderTicketNotes
        {...idle}
        notes={[]}
        note={'Line one\nLine two\nLine three'}
      />,
    );
    const input = screen.getByTestId('order-ticket-note-input') as HTMLTextAreaElement;
    expect(input).toHaveClass('min-h-9');
    expect(input).toHaveClass('max-h-[120px]');
    // jsdom scrollHeight stays small; assert grow plumbing ran (inline height set).
    expect(input.style.height).toMatch(/px$/);
  });
});
