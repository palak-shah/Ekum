import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QtyStepper } from './QtyStepper';

afterEach(() => cleanup());

describe('QtyStepper autoFocus', () => {
  it('lands in the piece box when Same for all opens', () => {
    render(
      <QtyStepper
        autoFocus
        value={20}
        aria-label="Same pieces for all designs"
        onChange={vi.fn()}
      />,
    );
    const box = screen.getByRole('textbox', { name: 'Same pieces for all designs' });
    expect(box).toHaveFocus();
    expect(box).toHaveValue('20');
  });
});

describe('QtyStepper edit 20', () => {
  it('lets the trader delete the 2 and type a new count', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QtyStepper value={20} aria-label="Pieces" onChange={onChange} />);
    const box = screen.getByRole('textbox', { name: 'Pieces' });
    await user.click(box);
    await user.keyboard('{Backspace}');
    expect(box).toHaveValue('');
    await user.keyboard('15');
    expect(box).toHaveValue('15');
    expect(onChange).toHaveBeenLastCalledWith(15);
  });
});

describe('QtyStepper first count', () => {
  it('starts empty so they type the first pieces', () => {
    render(<QtyStepper value={null} aria-label="Pieces" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Pieces' })).toHaveValue('');
  });
});

describe('QtyStepper step', () => {
  it('adds and removes one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QtyStepper value={5} aria-label="sets for Navy" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Increase sets for Navy' }));
    expect(onChange).toHaveBeenLastCalledWith(6);
    await user.click(screen.getByRole('button', { name: 'Decrease sets for Navy' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
  });
});
