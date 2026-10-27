import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BrowseLotChrome } from './BrowseLotChrome';

function FindHarness() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  return (
    <BrowseLotChrome
      findOpen={open}
      findLabel="Find collections"
      findValue={query}
      onFindToggle={() => setOpen((next) => !next)}
      onFindChange={setQuery}
      selecting={false}
      selectedCount={0}
      allSelected={false}
      onEnterSelect={() => undefined}
      onSelectAll={() => undefined}
      onClear={() => undefined}
    />
  );
}

describe('BrowseLotChrome', () => {
  it('focuses Find so typing starts in the field without a second tap', async () => {
    const user = userEvent.setup();
    render(<FindHarness />);
    await user.click(screen.getByTestId('browse-lot-find-toggle'));
    const field = screen.getByTestId('browse-lot-find');
    expect(field).toHaveFocus();
    await user.keyboard('georgette');
    expect(field).toHaveValue('georgette');
  });
});
