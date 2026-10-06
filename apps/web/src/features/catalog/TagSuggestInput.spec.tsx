import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagSuggestInput } from './TagSuggestInput';

describe('TagSuggestInput', () => {
  it('keeps the list open so a second tag can be added', async () => {
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
    await user.click(screen.getByRole('option', { name: 'Readymade' }));
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
    expect(screen.getByRole('option', { name: 'Saree' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Readymade' })).toBeNull();
    expect(screen.getByLabelText('Remove Readymade')).toBeTruthy();
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
