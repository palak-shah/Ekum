import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectAllFloat } from './SelectAllFloat';

describe('SelectAllFloat', () => {
  it('hides when closed', () => {
    const { container } = render(
      <SelectAllFloat
        open={false}
        count={0}
        allSelected={false}
        onSelectAll={() => {}}
        onClear={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('select-all-float')).toBeNull();
  });

  it('shows Select all and Clear while selecting', () => {
    render(
      <SelectAllFloat
        open
        count={1}
        allSelected={false}
        onSelectAll={() => {}}
        onClear={() => {}}
      />,
    );
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('1 selected');
    expect(screen.getByTestId('select-all-float-select-all')).toHaveTextContent('Select all');
    expect(screen.getByTestId('select-all-float-clear')).toHaveTextContent('Clear');
  });

  it('disables Select all when everything visible is picked', () => {
    render(
      <SelectAllFloat
        open
        count={3}
        allSelected
        onSelectAll={() => {}}
        onClear={() => {}}
      />,
    );
    expect(screen.getByTestId('select-all-float-select-all')).toBeDisabled();
  });

  it('fires Clear', async () => {
    const onClear = vi.fn();
    render(
      <SelectAllFloat
        open
        count={3}
        allSelected
        onSelectAll={() => {}}
        onClear={onClear}
      />,
    );
    await userEvent.click(screen.getByTestId('select-all-float-clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('sits under the page header band', () => {
    render(
      <div className="relative">
        <SelectAllFloat
          open
          count={0}
          allSelected={false}
          onSelectAll={() => {}}
          onClear={() => {}}
        />
      </div>,
    );
    const bar = screen.getByTestId('select-all-float');
    expect(bar.className).toMatch(/sticky/);
    expect(bar.className).toMatch(/top-\[3\.25rem\]/);
  });
});
