import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { YOU_LIBRARY_FIND_MENU, YouLibraryFilterMenu } from './YouLibraryFilterMenu';

describe('YouLibraryFilterMenu', () => {
  it('lists Draft, Archived, Saved — not Published', () => {
    expect(YOU_LIBRARY_FIND_MENU.map((row) => row.id)).toEqual(['draft', 'archived', 'saved']);
  });

  it('picks Draft from the menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onClose = vi.fn();
    const anchorRef = createRef<HTMLButtonElement>();
    render(
      <>
        <button ref={anchorRef} type="button">
          Filter
        </button>
        <YouLibraryFilterMenu
          open
          onClose={onClose}
          anchorRef={anchorRef}
          value="published"
          showSaved
          onChange={onChange}
        />
      </>,
    );
    await user.click(screen.getByTestId('you-library-filter-draft'));
    expect(onChange).toHaveBeenCalledWith('draft');
    expect(screen.queryByRole('button', { name: 'Published' })).toBeNull();
  });
});
