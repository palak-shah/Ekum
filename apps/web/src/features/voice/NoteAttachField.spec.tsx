import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NoteAttachField } from './NoteAttachField';

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/mediaUpload', () => ({
  uploadImage: vi.fn(),
  uploadAudio: vi.fn(),
}));

describe('NoteAttachField', () => {
  it('text control is a textbox with photo + (no voice)', async () => {
    const user = userEvent.setup();
    render(
      <NoteAttachField
        label="Manual order no."
        note="PO-19"
        onNoteChange={vi.fn()}
        voice={null}
        onVoiceChange={vi.fn()}
        images={[]}
        onImagesChange={vi.fn()}
        allowVoice={false}
        control="text"
        placeholder="Your book / PO number"
        inputTestId="order-lines-manual-ref-number"
        testId="order-lines-manual-ref"
      />,
    );
    const block = screen.getByTestId('order-lines-manual-ref');
    const input = screen.getByTestId('order-lines-manual-ref-number');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveValue('PO-19');
    expect(block.querySelector('textarea')).toBeNull();
    await user.click(within(block).getByTestId('note-attach-plus'));
    expect(within(block).getByTestId('note-attach-menu')).toBeInTheDocument();
    expect(within(block).getByTestId('note-attach-camera')).toBeInTheDocument();
    expect(within(block).getByTestId('note-attach-gallery')).toBeInTheDocument();
    expect(within(block).queryByRole('menuitem', { name: 'Voice' })).toBeNull();
    expect(within(block).getByTestId('note-attach-plus')).toHaveAttribute(
      'aria-label',
      'Add photo',
    );
  });

  it('collapseEmpty uses addLabel until they expand', async () => {
    const user = userEvent.setup();
    render(
      <NoteAttachField
        label="Personal note"
        note=""
        onNoteChange={vi.fn()}
        voice={null}
        onVoiceChange={vi.fn()}
        images={[]}
        onImagesChange={vi.fn()}
        collapseEmpty
        addLabel="Add personal note"
        hint="Only your company sees this — not the other party."
        testId="order-lines-personal-note"
      />,
    );
    const block = screen.getByTestId('order-lines-personal-note');
    expect(within(block).getByTestId('note-attach-add')).toHaveTextContent(
      'Add personal note',
    );
    expect(
      screen.queryByText('Only your company sees this — not the other party.'),
    ).toBeNull();
    await user.click(within(block).getByTestId('note-attach-add'));
    expect(
      screen.getByText('Only your company sees this — not the other party.'),
    ).toBeInTheDocument();
    expect(block.querySelector('textarea')).toBeInTheDocument();
  });
});
