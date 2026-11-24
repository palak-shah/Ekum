import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RepostPricingMode } from '@ekum/domain-types';
import { RepostPricingFields } from './RepostPricingFields';
import { defaultPackRepostPricingForm } from './repostPricingForm';

afterEach(() => cleanup());

describe('RepostPricingFields prototype', () => {
  it('shows Same as supplier / Edit rate / Set margin and hides per-design inputs on Same', () => {
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

  it('Edit shows Supplier cue without Now ₹ or buyer preview', () => {
    render(
      <RepostPricingFields
        variant="prototype"
        value={{ mode: RepostPricingMode.Edit, marginValue: '', editedRate: '700' }}
        onChange={() => {}}
        supplierCue="Supplier ₹420/pc"
      />,
    );
    expect(screen.getByTestId('repost-pricing-supplier-cue')).toHaveTextContent(
      'Supplier ₹420/pc',
    );
    expect(screen.queryByTestId('repost-pricing-previous-rate')).toBeNull();
    expect(screen.queryByTestId('repost-pricing-buyer-preview')).toBeNull();
  });

  it('Edit shows one pack Your rate ₹ (no per-design list)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <RepostPricingFields
        variant="prototype"
        value={defaultPackRepostPricingForm()}
        onChange={onChange}
        supplierCue="Supplier ₹100/pc"
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
        supplierCue="Supplier ₹100/pc"
      />,
    );
    expect(screen.getByTestId('repost-pricing-edit-pack')).toBeTruthy();
    expect(screen.getByTestId('repost-pricing-edited-rate')).toBeTruthy();
    expect(screen.queryByTestId('repost-pricing-edit-list')).toBeNull();
    expect(screen.getByText('Supplier ₹100/pc')).toBeTruthy();
    await user.type(screen.getByTestId('repost-pricing-edited-rate'), '150');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ editedRate: expect.stringContaining('1') }),
    );
  });

  it('switching Margin clears editedRate; Edit clears margin', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <RepostPricingFields
        variant="prototype"
        value={{
          mode: RepostPricingMode.Edit,
          marginValue: '5',
          editedRate: '140',
        }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByTestId('repost-pricing-margin'));
    expect(onChange).toHaveBeenCalledWith({
      mode: RepostPricingMode.MarginFixed,
      marginValue: '5',
      editedRate: '',
    });
    rerender(
      <RepostPricingFields
        variant="prototype"
        value={{
          mode: RepostPricingMode.MarginFixed,
          marginValue: '10',
          editedRate: '99',
        }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByTestId('repost-pricing-edit'));
    expect(onChange).toHaveBeenLastCalledWith({
      mode: RepostPricingMode.Edit,
      marginValue: '',
      editedRate: '99',
    });
  });

  it('Margin shows ₹/% subcontrol and keeps draft value across toggle', async () => {
    const user = userEvent.setup();
    let form = {
      mode: RepostPricingMode.MarginFixed,
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
    expect(screen.getByTestId('repost-pricing-margin-value')).toHaveAttribute(
      'placeholder',
      '0',
    );
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

  it('minus steps below 0 (discount)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RepostPricingFields
        variant="prototype"
        value={{
          mode: RepostPricingMode.MarginFixed,
          marginValue: '0',
          editedRate: '',
        }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByTestId('repost-pricing-margin-minus'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ marginValue: '-1' }),
    );
  });
});
