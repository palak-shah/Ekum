import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MasterCategoryField } from './MasterCategoryField';

const options = [
  { id: 'cat-1', label: 'Home textiles – Readyset' },
  { id: 'cat-2', label: 'Womens – Unstitched' },
];

describe('MasterCategoryField', () => {
  it('shows a sheet picker when the design is not in a pack', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MasterCategoryField value="cat-1" onChange={onChange} options={options} />);
    const trigger = screen.getByTestId('collection-master-category');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('data-value', 'cat-1');
    expect(trigger).toHaveTextContent('Home textiles – Readyset');
    await user.click(trigger);
    await user.click(screen.getByTestId('collection-master-category-option-cat-2'));
    expect(onChange).toHaveBeenCalledWith('cat-2');
  });

  it('shows a sheet picker when the pack has not chosen a category yet', () => {
    render(
      <MasterCategoryField
        value={null}
        onChange={() => undefined}
        options={options}
        testId="design-master-category"
      />,
    );
    expect(screen.getByTestId('design-master-category').tagName).toBe('BUTTON');
    expect(screen.getByTestId('design-master-category')).toHaveAttribute('data-value', '');
    expect(screen.getByTestId('design-master-category')).not.toHaveTextContent('Pick category');
  });

  it('shows a category error under Category, not the name', () => {
    render(
      <MasterCategoryField
        value={null}
        onChange={() => undefined}
        options={options}
        error="Pick a category."
      />,
    );
    expect(screen.getByText('Pick a category.')).toBeInTheDocument();
  });

  it('locks to the collection category with no dropdown', () => {
    render(
      <MasterCategoryField
        locked
        value="cat-1"
        onChange={() => undefined}
        options={options}
      />,
    );
    expect(screen.getByTestId('collection-master-category').tagName).toBe('DIV');
    expect(screen.getByTestId('collection-master-category')).toHaveTextContent(
      'Home textiles – Readyset',
    );
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
