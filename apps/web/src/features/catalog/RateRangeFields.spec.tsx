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
    expect(screen.getByTestId('collection-rate-caption')).toHaveTextContent('₹1,200');
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
    await user.selectOptions(select, 'set');
    expect(onRateUnit).toHaveBeenCalledWith('set');
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
});

