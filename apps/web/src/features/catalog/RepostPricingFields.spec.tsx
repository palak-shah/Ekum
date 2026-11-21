import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RepostPricingMode } from '@ekum/domain-types';
import { RepostPricingFields } from './RepostPricingFields';
import { defaultPackRepostPricingForm } from './repostPricingForm';

afterEach(() => cleanup());

describe('RepostPricingFields prototype', () => {
  it('shows Same / Edit / ± Margin and hides per-design inputs on Same', () => {
    render(
      <RepostPricingFields
        variant="prototype"
        value={defaultPackRepostPricingForm()}
        onChange={() => undefined}
        editDesigns={[
          { productId: 'p1', name: 'Silk', supplierRate: 100, supplierRateLabel: 'Supplier ₹100' },
        ]}
        editRatesByProductId={{}}
      />,
    );
    expect(screen.getByTestId('repost-pricing-choices')).toBeTruthy();
    expect(screen.getByTestId('repost-pricing-same')).toBeTruthy();
    expect(screen.getByTestId('repost-pricing-edit')).toBeTruthy();
    expect(screen.getByTestId('repost-pricing-margin')).toBeTruthy();
    expect(screen.queryByTestId('repost-pricing-edit-list')).toBeNull();
    expect(screen.queryByTestId('repost-pricing-margin-block')).toBeNull();
  });

  it('Edit lists designs with supplier ref; restricted omits ₹ but keeps input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onEditRateChange = vi.fn();
    const { rerender } = render(
      <RepostPricingFields
        variant="prototype"
        value={defaultPackRepostPricingForm()}
        onChange={onChange}
        editDesigns={[
          {
            productId: 'p1',
            name: 'Silk',
            supplierRate: 100,
            supplierRateLabel: 'Supplier ₹100/pc',
          },
          { productId: 'p2', name: 'Cotton', supplierRate: null },
        ]}
        editRatesByProductId={{}}
        onEditRateChange={onEditRateChange}
      />,
    );
    await user.click(screen.getByTestId('repost-pricing-edit'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: RepostPricingMode.Edit }),
    );
    rerender(
      <RepostPricingFields
        variant="prototype"
        value={{ mode: RepostPricingMode.Edit, marginValue: '', editedRate: '' }}
        onChange={onChange}
        editDesigns={[
          {
            productId: 'p1',
            name: 'Silk',
            supplierRate: 100,
            supplierRateLabel: 'Supplier ₹100/pc',
          },
          { productId: 'p2', name: 'Cotton', supplierRate: null },
        ]}
        editRatesByProductId={{}}
        onEditRateChange={onEditRateChange}
      />,
    );
    expect(screen.getByTestId('repost-pricing-edit-list')).toBeTruthy();
    expect(screen.getByText('Supplier ₹100/pc')).toBeTruthy();
    expect(screen.getByText('Supplier rate not shared')).toBeTruthy();
    await user.type(screen.getByTestId('repost-pricing-edit-rate-p2'), '90');
    expect(onEditRateChange).toHaveBeenCalled();
  });

  it('Margin shows ₹/% subcontrol and keeps draft value across toggle', async () => {
    const user = userEvent.setup();
    let form = {
      mode: RepostPricingMode.MarginFixed as const,
      marginValue: '10',
      editedRate: '',
    };
    const onChange = vi.fn((next) => {
      form = next;
    });
    const { rerender } = render(
      <RepostPricingFields variant="prototype" value={form} onChange={onChange} />,
    );
    expect(screen.getByTestId('repost-pricing-margin-block')).toBeTruthy();
    await user.click(screen.getByTestId('repost-pricing-margin-percent'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: RepostPricingMode.MarginPercent,
        marginValue: '10',
      }),
    );
    rerender(
      <RepostPricingFields
        variant="prototype"
        value={{ ...form, mode: RepostPricingMode.MarginPercent }}
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('repost-pricing-margin-value')).toHaveValue('10');
  });
});
