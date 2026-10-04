import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveOrDiscardSheet } from './SaveOrDiscardSheet';
import { DiscardChangesSheet } from './DiscardChangesSheet';

describe('SaveOrDiscardSheet', () => {
  it('offers Save then Discard for edit leave', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    render(
      <SaveOrDiscardSheet
        open
        onCancel={() => {}}
        onDiscard={onDiscard}
        onSave={onSave}
      />,
    );
    expect(screen.getByText('Save changes?')).toBeInTheDocument();
    expect(screen.getByText(/Update is at the bottom/i)).toBeInTheDocument();
    const sheet = screen.getByTestId('save-or-discard-sheet');
    expect(sheet).toHaveTextContent('Save');
    expect(sheet).toHaveTextContent('Discard');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

describe('DiscardChangesSheet', () => {
  it('keeps Leave the page copy for other flows', () => {
    render(
      <DiscardChangesSheet open onCancel={() => {}} onLeave={() => {}} />,
    );
    expect(screen.getByText('Leave the page?')).toBeInTheDocument();
    expect(screen.getByTestId('discard-changes-sheet')).toHaveTextContent('Leave');
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });
});
