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
  it('stays a quiet Add note until they tap — empty box is not the highlight', async () => {
    const user = userEvent.setup();
    render(<NoteHarness />);
    expect(screen.queryByTestId('how-many-note')).toBeNull();
    await user.click(screen.getByTestId('how-many-add-note'));
    const field = screen.getByTestId('how-many-note');
    expect(field).toHaveAttribute('placeholder', 'Colour, packing…');
    await user.type(field, 'Navy only');
    expect(field).toHaveValue('Navy only');
  });

  it('keeps a filled note open', () => {
    render(<NoteHarness initial="4 pcs extra" />);
    expect(screen.getByTestId('how-many-note')).toHaveValue('4 pcs extra');
    expect(screen.queryByTestId('how-many-add-note')).toBeNull();
  });
});
