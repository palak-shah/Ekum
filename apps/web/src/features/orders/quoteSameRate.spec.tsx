import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SameRateForAll } from './quoteSameRate';

afterEach(() => cleanup());

describe('SameRateForAll', () => {
  it('opens a rate editor from the chip; Apply is rates only', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <SameRateForAll
        show
        open={false}
        draft=""
        applied=""
        onOpen={vi.fn()}
        onDraftChange={vi.fn()}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId('same-for-all-chip')).toHaveTextContent('Same for all');
    expect(screen.queryByLabelText('Same rate for all designs')).toBeNull();

    rerender(
      <SameRateForAll
        show
        open
        draft="85"
        applied=""
        onOpen={vi.fn()}
        onDraftChange={vi.fn()}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Same rate for all designs')).toHaveValue('85');
    expect(screen.getByLabelText('Same rate for all designs')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it('lets you type a single rate in the focused box', async () => {
    const onDraftChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SameRateForAll
        show
        open
        draft=""
        applied=""
        onOpen={vi.fn()}
        onDraftChange={onDraftChange}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const box = screen.getByLabelText('Same rate for all designs');
    expect(box).toHaveFocus();
    expect(box).toHaveAttribute('placeholder', '');
    await user.keyboard('1200');
    expect(onDraftChange.mock.calls.some((call) => String(call[0]).includes('1'))).toBe(true);
  });
});
