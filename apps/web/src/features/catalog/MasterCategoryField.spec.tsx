import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MasterCategoryField } from './MasterCategoryField';

const options = [
  { id: 'cat-1', label: 'Home textiles – Readyset' },
  { id: 'cat-2', label: 'Womens – Unstitched' },
];

describe('MasterCategoryField', () => {
  it('shows a dropdown when the design is not in a pack', () => {
    render(
      <MasterCategoryField value="cat-1" onChange={() => undefined} options={options} />,
    );
    expect(screen.getByTestId('collection-master-category').tagName).toBe('SELECT');
    expect(screen.getByTestId('collection-master-category')).toHaveValue('cat-1');
  });

  it('shows a dropdown when the pack has not chosen a category yet', () => {
    render(
      <MasterCategoryField
        value={null}
        onChange={() => undefined}
        options={options}
        testId="design-master-category"
      />,
    );
    expect(screen.getByTestId('design-master-category').tagName).toBe('SELECT');
    expect(screen.getByTestId('design-master-category')).toHaveValue('');
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
