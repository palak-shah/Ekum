import { describe, expect, it } from 'vitest';
import type { OrderItemView } from '@ekum/domain-types';
import {
  orderFormFileName,
  orderFormLines,
  orderFormPdfBytes,
  orderFormRows,
  orderFormTotalLines,
} from './orderForm';

function item(partial: Partial<OrderItemView> & Pick<OrderItemView, 'id' | 'name'>): OrderItemView {
  return {
    productId: null,
    sku: null,
    rate: 100,
    unit: 'mtr',
    dispatchUnit: 'mtr',
    catalogRateUnit: 'mtr',
    piecesPerPack: null,
    image: null,
    images: [],
    quantity: 20,
    requestedQuantity: 20,
    lineStatus: 'confirmed',
    shippedQuantity: 0,
    remainingQuantity: 20,
    note: null,
    ...partial,
  };
}

const base = {
  orderId: 'cmorderabcdefghijk',
  createdAt: '2026-10-21T10:00:00.000Z',
  sellerName: 'Ravi Textiles',
  buyerName: 'Meena Traders',
  items: [item({ id: 'i1', name: 'Cotton Grey', quantity: 20, rate: 128 })],
};

describe('orderForm', () => {
  it('prints ORDER FORM with From supplier and To buyer', () => {
    const text = orderFormLines(base).join('\n');
    expect(text).toMatch(/ORDER FORM/);
    expect(text).toMatch(/From: Ravi Textiles/);
    expect(text).toMatch(/To: Meena Traders/);
    expect(text).toMatch(/Order #/);
    expect(text).toMatch(/20 mtrs/);
    expect(text).toMatch(/Rs128\/mtr/);
    expect(text).toMatch(/₹2,560/);
  });

  it('titles inquiry tickets INQUIRY', () => {
    const text = orderFormLines({ ...base, intent: 'inquiry' }).join('\n');
    expect(text).toMatch(/INQUIRY/);
    expect(text).not.toMatch(/ORDER FORM/);
    expect(text).toMatch(/Inquiry #/);
  });

  it('includes manual order no when set', () => {
    const text = orderFormLines({ ...base, manualOrderNo: 'PO-19' }).join('\n');
    expect(text).toMatch(/No: PO-19/);
  });

  it('keeps Can’t supply rows with muted qty copy', () => {
    const rows = orderFormRows({
      ...base,
      items: [
        item({ id: 'i1', name: 'Cotton Grey' }),
        item({
          id: 'i2',
          name: 'Silk Print',
          lineStatus: 'declined',
          quantity: 10,
          remainingQuantity: 0,
        }),
      ],
    });
    expect(rows.map((row) => ({ name: row.name, quantity: row.quantity, cantSupply: row.cantSupply }))).toEqual([
      { name: 'Cotton Grey', quantity: '20 mtrs', cantSupply: false },
      { name: 'Silk Print', quantity: "Can't supply", cantSupply: true },
    ]);
    expect(rows[1]?.rate).toBe('');
    expect(rows[1]?.bill).toBe('');
  });

  it('qty is order unit only — not dual dispatch conversion', () => {
    const rows = orderFormRows({
      ...base,
      items: [
        item({
          id: 'i1',
          name: 'Set design',
          unit: 'set',
          dispatchUnit: 'pc',
          piecesPerPack: 4,
          quantity: 10,
          rate: 100,
        }),
      ],
    });
    expect(rows[0]?.quantity).toBe('10 sets');
    expect(rows[0]?.quantity).not.toMatch(/=/);
  });

  it('Total follows ticket mill-bill — all-blank pack has no ₹ and no pack cue', () => {
    expect(
      orderFormTotalLines({
        ...base,
        items: [
          item({
            id: 'i1',
            name: 'Set A',
            unit: 'set',
            dispatchUnit: 'pc',
            piecesPerPack: null,
            quantity: 10,
            rate: 100,
          }),
        ],
      }),
    ).toEqual(['Total 10 sets']);
  });

  it('Total with no billed ₹ has no +Missing rates', () => {
    expect(
      orderFormTotalLines({
        ...base,
        items: [
          item({ id: 'i1', name: 'Grey', unit: 'mtr', dispatchUnit: 'mtr', quantity: 10, rate: null }),
          item({ id: 'i2', name: 'Swatch', unit: 'pc', dispatchUnit: 'pc', quantity: 5, rate: null }),
        ],
      }),
    ).toEqual(['Total 10 mtrs', '5 pcs']);
  });

  it('mixed pack with billed ₹ keeps unconverted qty and +No pcs in a set', () => {
    expect(
      orderFormTotalLines({
        ...base,
        items: [
          item({
            id: 'i1',
            name: 'Set A',
            unit: 'set',
            dispatchUnit: 'pc',
            piecesPerPack: 4,
            quantity: 10,
            rate: 100,
          }),
          item({
            id: 'i2',
            name: 'Set B',
            unit: 'set',
            dispatchUnit: 'pc',
            piecesPerPack: null,
            quantity: 5,
            rate: 100,
          }),
        ],
      }),
    ).toEqual(['Total 15 sets  ₹4,000', '+No pcs in a set']);
  });

  it('builds a printable PDF with both shops and rates', async () => {
    const bytes = await orderFormPdfBytes({ ...base, options: { showPhotos: false } });
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text.slice(0, 8)).toBe('%PDF-1.4');
    expect(text).toContain('/BaseFont /Helvetica-Bold');
    expect(text).toContain('ORDER FORM');
    expect(text).toContain('From: Ravi Textiles');
    expect(text).toContain('To: Meena Traders');
    expect(text).toContain('20 mtrs');
    expect(text).toContain('Rs128/mtr');
    expect(text).toContain('Rs2,560');
    expect(orderFormFileName(base)).toMatch(/Order#.*-form\.pdf$/);
  });

  it('prints INQUIRY in the PDF and skips Show-buyer option (always both shops)', async () => {
    const bytes = await orderFormPdfBytes({
      ...base,
      intent: 'inquiry',
      options: { showPhotos: false },
    });
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('INQUIRY');
    expect(text).toContain('From: Ravi Textiles');
    expect(text).toContain('To: Meena Traders');
    expect(text).not.toContain('ORDER FORM');
  });
});
