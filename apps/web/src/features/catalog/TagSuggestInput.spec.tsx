import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isTagSuggestListScroll, TagSuggestInput } from './TagSuggestInput';

describe('TagSuggestInput', () => {
  it('keeps remaining suggestions after a pick; Escape blurs to exit', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <TagSuggestInput
        label="Item tags"
        values={[]}
        onChange={onChange}
        suggestionsFor={() => ['Readymade', 'Saree']}
        testId="collection-tag-item"
      />,
    );
    await user.click(screen.getByTestId('collection-tag-item'));
    const option = screen.getByRole('option', { name: 'Readymade' });
    expect(option.closest('label')).toBeNull();
    await user.click(option);
    expect(onChange).toHaveBeenCalledWith(['Readymade']);
    rerender(
      <TagSuggestInput
        label="Item tags"
        values={['Readymade']}
        onChange={onChange}
        suggestionsFor={() => ['Readymade', 'Saree']}
        testId="collection-tag-item"
      />,
    );
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Saree' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Readymade' })).toBeNull();
    expect(screen.getByLabelText('Remove Readymade')).toBeTruthy();
    await user.click(screen.getByTestId('collection-tag-item-dismiss'));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByTestId('collection-tag-item')).not.toHaveFocus();
  });

  it('does not pick a tag on pointer down so the list can scroll', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TagSuggestInput
        label="Item tags"
        values={[]}
        onChange={onChange}
        suggestionsFor={() => ['Readymade', 'Saree', 'Kurti', 'Lehenga']}
        testId="collection-tag-item"
      />,
    );
    await user.click(screen.getByTestId('collection-tag-item'));
    const option = screen.getByRole('option', { name: 'Readymade' });
    fireEvent.pointerDown(option);
    expect(onChange).not.toHaveBeenCalled();
    const list = screen.getByRole('listbox');
    expect(list.className).toMatch(/overflow-auto/);
    expect(list.className).toMatch(/touch-pan-y/);
    expect(isTagSuggestListScroll(list, list)).toBe(true);
    expect(isTagSuggestListScroll(document.body, list)).toBe(false);
  });

  it('opens the list on the page body so sticky chrome cannot clip it', async () => {
    const user = userEvent.setup();
    render(
      <div className="overflow-hidden">
        <TagSuggestInput
          label="Item tags"
          values={[]}
          onChange={() => {}}
          suggestionsFor={() => ['Readymade', 'Saree']}
          testId="collection-tag-item"
        />
      </div>,
    );
    await user.click(screen.getByTestId('collection-tag-item'));
    const list = screen.getByRole('listbox');
    expect(list.parentElement).toBe(document.body);
    expect(list.className).toContain('fixed');
    expect(list.className).toContain('z-[80]');
  });

  it('uses the word tags on the field label', () => {
    render(
      <TagSuggestInput
        label="Quality / work tags"
        values={[]}
        onChange={() => {}}
        suggestionsFor={() => []}
      />,
    );
    expect(screen.getByText('Quality / work tags')).toBeTruthy();
  });
});
