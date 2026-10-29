import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OptionSheetField } from './OptionSheetField';

const options = [
  { value: 'pc', label: 'pc' },
  { value: 'mtr', label: 'mtr' },
  { value: 'set', label: 'set' },
];

describe('OptionSheetField', () => {
  it('shows the selected label on a kit field, not a native select', () => {
    render(
      <OptionSheetField
        value="pc"
        options={options}
        onChange={() => undefined}
        testId="collection-rate-unit"
        sheetTitle="Rate per"
      />,
    );
    const trigger = screen.getByTestId('collection-rate-unit');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('data-value', 'pc');
    expect(trigger).toHaveTextContent('pc');
    expect(trigger.className).toContain('bg-input');
    expect(trigger.className).toMatch(/(?:^|\s)text-base(?:\s|$)/);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a sheet of tappable rows and commits a pick', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <OptionSheetField
        value="pc"
        options={options}
        onChange={onChange}
        testId="collection-rate-unit"
        sheetTitle="Rate per"
      />,
    );
    await user.click(screen.getByTestId('collection-rate-unit'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Rate per')).toBeTruthy();
    const mtr = screen.getByTestId('collection-rate-unit-option-mtr');
    expect(mtr.className).toContain('border-line');
    expect(screen.getByTestId('collection-rate-unit-option-pc').className).toContain(
      'border-accent',
    );
    await user.click(mtr);
    expect(onChange).toHaveBeenCalledWith('mtr');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders an empty muted field when nothing is chosen', () => {
    render(
      <OptionSheetField
        value=""
        options={[{ value: 'cat-1', label: 'Home textiles – Readyset' }]}
        onChange={() => undefined}
        testId="collection-master-category"
        sheetTitle="Category"
      />,
    );
    const trigger = screen.getByTestId('collection-master-category');
    expect(trigger).toHaveAttribute('data-value', '');
    expect(trigger).not.toHaveTextContent('Pick category');
    expect(trigger.className).toContain('text-muted');
  });
});
