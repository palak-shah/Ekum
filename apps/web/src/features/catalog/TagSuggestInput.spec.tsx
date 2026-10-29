import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  isTagSuggestListScroll,
  tagSuggestBottomClear,
  tagSuggestGestureIsScroll,
  TagSuggestInput,
} from './TagSuggestInput';

describe('TagSuggestInput', () => {
  it('drops dock clearance when the visual viewport shrinks for the keyboard', () => {
    expect(tagSuggestBottomClear(800, 780)).toBe(136);
    expect(tagSuggestBottomClear(800, 400)).toBe(8);
  });

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
    expect(tagSuggestGestureIsScroll(100, 108)).toBe(true);
    expect(tagSuggestGestureIsScroll(100, 104)).toBe(false);
  });

  it('does not pick a tag when the finger slides or the list scrolls', async () => {
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
    const list = screen.getByRole('listbox');
    fireEvent.pointerDown(option, { pointerType: 'touch', clientY: 120 });
    fireEvent.pointerMove(option, { pointerType: 'touch', clientY: 160 });
    fireEvent.click(option);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(option, { pointerType: 'touch', clientY: 120 });
    fireEvent.scroll(list);
    fireEvent.click(option);
    expect(onChange).not.toHaveBeenCalled();
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

  it('still closes on blur after a list pointer is dismissed', async () => {
    const user = userEvent.setup();
    render(
      <TagSuggestInput
        label="Item tags"
        values={[]}
        onChange={() => {}}
        suggestionsFor={() => ['Readymade', 'Saree']}
        testId="collection-tag-item"
      />,
    );
    const input = screen.getByTestId('collection-tag-item');
    await user.click(input);
    fireEvent.pointerDown(screen.getByRole('option', { name: 'Readymade' }));
    fireEvent.blur(input);
    expect(screen.getByRole('listbox')).toBeTruthy();
    await user.click(screen.getByTestId('collection-tag-item-dismiss'));
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.blur(input);
    expect(screen.queryByRole('listbox')).toBeNull();
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
