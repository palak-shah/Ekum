import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectAllFloat } from './SelectAllFloat';

afterEach(() => cleanup());

describe('SelectAllFloat', () => {
  it('renders nothing when closed', () => {
    render(
      <SelectAllFloat open={false} count={0} action="select-all" onAction={() => {}} />,
    );
    expect(screen.queryByTestId('select-all-float')).toBeNull();
  });

  it('shows Select all at 0 selected', () => {
    render(
      <SelectAllFloat open count={0} action="select-all" onAction={() => {}} />,
    );
    expect(screen.getByTestId('select-all-float')).toHaveTextContent('0 selected');
    expect(screen.getByTestId('select-all-float-action')).toHaveTextContent('Select all');
  });

  it('shows Clear when action is clear', async () => {
    const onAction = vi.fn();
    render(<SelectAllFloat open count={3} action="clear" onAction={onAction} />);
    expect(screen.getByTestId('select-all-float-action')).toHaveTextContent('Clear');
    await userEvent.click(screen.getByTestId('select-all-float-action'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
