import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RateRangeFields } from './RateRangeFields';

describe('RateRangeFields', () => {
  it('defaults to One rate with no On request caption', () => {
    render(<RateRangeFields from="" to="" onFrom={() => undefined} onTo={() => undefined} />);
    expect(screen.getByTestId('collection-rate-mode-single')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('collection-rate-mode-single')).toHaveTextContent('One rate');
    expect(screen.getByTestId('collection-rate-mode-range')).toHaveTextContent('A range');
    expect(screen.queryByTestId('collection-rate-to')).toBeNull();
    expect(screen.getByTestId('collection-rate-from')).toHaveAttribute('placeholder', 'Rate');
    expect(screen.getByTestId('collection-rate-from').className).toContain('placeholder:not-italic');
    expect(screen.getByTestId('collection-rate-from').className).toContain('placeholder:text-sm');
    expect(screen.getByTestId('collection-rate-from').className).toContain('placeholder:text-muted');
    expect(screen.getByTestId('collection-rate-from').className).not.toMatch(
      /(?:^|\s)placeholder:italic(?:\s|$)/,
    );
    expect(screen.getAllByTestId('collection-rate-prefix')).toHaveLength(1);
    expect(screen.queryByTestId('collection-rate-caption')).toBeNull();
    expect(screen.queryByText('On request')).toBeNull();
    expect(screen.queryByTestId('collection-rate-unit')).toBeNull();
  });

  it('opens range fields from A range', async () => {
    const user = userEvent.setup();
    const onTo = vi.fn();
    render(<RateRangeFields from="1200" to="" onFrom={() => undefined} onTo={onTo} />);
    await user.click(screen.getByTestId('collection-rate-mode-range'));
    expect(screen.getByTestId('collection-rate-to')).toBeTruthy();
    expect(screen.getByLabelText('Rate from')).toBeTruthy();
    expect(screen.getByLabelText('Rate to')).toBeTruthy();
    expect(screen.getByTestId('collection-rate-from')).not.toHaveAttribute('placeholder', 'Rate');
    expect(screen.getAllByTestId('collection-rate-prefix')).toHaveLength(2);
    expect(screen.queryByTestId('collection-rate-caption')).toBeNull();
  });

  it('warns when the high rate is below the low rate', () => {
    render(
      <RateRangeFields from="1200" to="800" onFrom={() => undefined} onTo={() => undefined} />,
    );
    expect(screen.getByTestId('collection-rate-caption')).toHaveTextContent(
      'High rate must be at least the low rate.',
    );
  });

  it('does not echo a formatted ₹ under a filled one-rate field', () => {
    render(
      <RateRangeFields from="2000" to="" onFrom={() => undefined} onTo={() => undefined} />,
    );
    expect(screen.getByTestId('collection-rate-from')).toHaveValue('2000');
    expect(screen.queryByTestId('collection-rate-caption')).toBeNull();
    expect(screen.queryByText('₹2,000')).toBeNull();
  });

  it('One rate clears the high end', async () => {
    const user = userEvent.setup();
    const onTo = vi.fn();
    render(<RateRangeFields from="1200" to="1400" onFrom={() => undefined} onTo={onTo} />);
    expect(screen.getByTestId('collection-rate-to')).toBeTruthy();
    await user.click(screen.getByTestId('collection-rate-mode-single'));
    expect(onTo).toHaveBeenCalledWith('');
  });

  it('Rate per unit select defaults to pc and reports changes', async () => {
    const user = userEvent.setup();
    const onRateUnit = vi.fn();
    render(
      <RateRangeFields
        from=""
        to=""
        onFrom={() => undefined}
        onTo={() => undefined}
        onRateUnit={onRateUnit}
      />,
    );
    expect(screen.getByText('Rate per')).toBeTruthy();
    const select = screen.getByTestId('collection-rate-unit');
    expect(select).toHaveValue('pc');
    expect(select.className).toContain('bg-input');
    expect(select.className).toMatch(/(?:^|\s)text-sm(?:\s|$)/);
    await user.selectOptions(select, 'set');
    expect(onRateUnit).toHaveBeenCalledWith('set');
  });

  it('fixedOnly is one amount with Rate per and no range switch', async () => {
    const user = userEvent.setup();
    const onRateUnit = vi.fn();
    const onFrom = vi.fn();
    render(
      <RateRangeFields
        fixedOnly
        from="1200"
        to="1400"
        onFrom={onFrom}
        onTo={() => undefined}
        rateUnit="set"
        onRateUnit={onRateUnit}
      />,
    );
    expect(screen.queryByTestId('collection-rate-mode')).toBeNull();
    expect(screen.queryByTestId('collection-rate-to')).toBeNull();
    expect(screen.getByText('Rate per')).toBeTruthy();
    expect(screen.getByTestId('collection-rate-unit')).toHaveValue('set');
    const amount = screen.getByTestId('collection-rate-from');
    expect(amount).toHaveValue('1200');
    expect(amount).toHaveAttribute('placeholder', 'Rate');
    expect(screen.getAllByTestId('collection-rate-prefix')).toHaveLength(1);
    expect(amount).toHaveAttribute('inputmode', 'decimal');
    await user.selectOptions(screen.getByTestId('collection-rate-unit'), 'pc');
    expect(onRateUnit).toHaveBeenCalledWith('pc');
    await user.clear(amount);
    await user.type(amount, '900');
    expect(onFrom).toHaveBeenCalled();
  });

  it('shows the wired rateUnit value', () => {
    render(
      <RateRangeFields
        from=""
        to=""
        onFrom={() => undefined}
        onTo={() => undefined}
        rateUnit="mtr"
        onRateUnit={() => undefined}
      />,
    );
    expect(screen.getByTestId('collection-rate-unit')).toHaveValue('mtr');
  });

  it('keeps an invalid Rate per selectable then coerces to a unit the category offers', async () => {
    const onRateUnit = vi.fn();
    render(
      <RateRangeFields
        from="91"
        to=""
        onFrom={() => undefined}
        onTo={() => undefined}
        rateUnit="pc"
        onRateUnit={onRateUnit}
        permittedUnits={['mtr', 'kg']}
      />,
    );
    const select = screen.getByTestId('collection-rate-unit');
    expect(select).toHaveValue('pc');
    expect(select).toHaveTextContent('pc');
    expect(onRateUnit).toHaveBeenCalledWith('mtr');
    await userEvent.setup().selectOptions(select, 'mtr');
    expect(onRateUnit).toHaveBeenCalledWith('mtr');
  });

  it('does not snap Jobwork mtr to pc when pc is only secondary', () => {
    const onRateUnit = vi.fn();
    render(
      <RateRangeFields
        from="91"
        to=""
        onFrom={() => undefined}
        onTo={() => undefined}
        rateUnit="mtr"
        onRateUnit={onRateUnit}
        permittedUnits={['mtr', 'kg', 'pc']}
      />,
    );
    expect(screen.getByTestId('collection-rate-unit')).toHaveValue('mtr');
    expect(screen.getByTestId('collection-rate-unit')).toHaveTextContent('kg');
    expect(screen.getByTestId('collection-rate-unit')).toHaveTextContent('pc');
    expect(onRateUnit).not.toHaveBeenCalled();
  });

  it('keeps a stored Jobwork pc on edit when the category still offers it', () => {
    const onRateUnit = vi.fn();
    render(
      <RateRangeFields
        from="91"
        to=""
        onFrom={() => undefined}
        onTo={() => undefined}
        rateUnit="pc"
        onRateUnit={onRateUnit}
        permittedUnits={['mtr', 'kg', 'pc']}
      />,
    );
    expect(screen.getByTestId('collection-rate-unit')).toHaveValue('pc');
    expect(onRateUnit).not.toHaveBeenCalled();
  });
});

