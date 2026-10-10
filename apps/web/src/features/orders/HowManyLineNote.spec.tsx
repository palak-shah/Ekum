import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { HowManyLineNote } from './HowManyLineNote';

function NoteHarness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <HowManyLineNote value={value} onChange={setValue} ariaLabel="Note for Navy" />;
}

describe('HowManyLineNote', () => {
  it('always shows a one-line note field', async () => {
    const user = userEvent.setup();
    render(<NoteHarness />);
    expect(screen.queryByTestId('how-many-add-note')).toBeNull();
    const field = screen.getByTestId('how-many-note');
    expect(field).toHaveAttribute('placeholder', 'Note');
    await user.type(field, 'Navy only');
    expect(field).toHaveValue('Navy only');
  });

  it('shows a filled note immediately', () => {
    render(<NoteHarness initial="4 pcs extra" />);
    const field = screen.getByTestId('how-many-note');
    expect(field).toHaveValue('4 pcs extra');
    expect(field).toHaveAttribute('placeholder', 'Note');
  });
});
