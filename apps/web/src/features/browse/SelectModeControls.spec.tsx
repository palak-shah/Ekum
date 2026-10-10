import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectModeControls } from './SelectModeControls';
import {
  selectModeShowsActiveChrome,
  selectModeShowsEnter,
  selectModeShowsSelectAll,
} from './selectModeVisibility';

afterEach(() => cleanup());

describe('selectModeVisibility', () => {
  it('shows Select idle and active chrome while Selecting', () => {
    expect(selectModeShowsEnter(false)).toBe(true);
    expect(selectModeShowsEnter(true)).toBe(false);
    expect(selectModeShowsActiveChrome(true)).toBe(true);
    expect(selectModeShowsSelectAll(true, true)).toBe(true);
    expect(selectModeShowsSelectAll(true, false)).toBe(false);
  });
});

describe('SelectModeControls', () => {
  it('enters Selecting and Clear exits', async () => {
    const user = userEvent.setup();
    const onEnterSelect = vi.fn();
    const onSelectAll = vi.fn();
    const onClear = vi.fn();
    const { rerender } = render(
      <SelectModeControls
        selecting={false}
        count={0}
        allSelected={false}
        onEnterSelect={onEnterSelect}
        onSelectAll={onSelectAll}
        onClear={onClear}
        selectTestId="collection-select"
      />,
    );
    await user.click(screen.getByTestId('collection-select'));
    expect(onEnterSelect).toHaveBeenCalled();

    rerender(
      <SelectModeControls
        selecting
        count={3}
        allSelected={false}
        onEnterSelect={onEnterSelect}
        onSelectAll={onSelectAll}
        onClear={onClear}
        selectTestId="collection-select"
      />,
    );
    expect(screen.queryByTestId('collection-select')).toBeNull();
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('3 selected');
    expect(screen.getByTestId('select-all-float-select-all')).toBeTruthy();
    await user.click(screen.getByTestId('select-all-float-clear'));
    expect(onClear).toHaveBeenCalled();
  });

  it('hides Select all when showSelectAll is false', () => {
    render(
      <SelectModeControls
        selecting
        count={1}
        allSelected={false}
        showSelectAll={false}
        onEnterSelect={() => undefined}
        onSelectAll={() => undefined}
        onClear={() => undefined}
        selectTestId="explore-select"
      />,
    );
    expect(screen.queryByTestId('select-all-float-select-all')).toBeNull();
    expect(screen.getByTestId('select-all-float-clear')).toBeTruthy();
  });
});
