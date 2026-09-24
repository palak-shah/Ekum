import { describe, expect, it } from 'vitest';
import { packingSlipFileName, packingSlipLines, packingSlipPdfBytes } from './packingSlip';

const shipment = {
  id: 's1',
  transporter: 'VRL',
  lrNumber: 'LR-1',
  parcelCount: 2,
  dispatchedAt: '2026-09-21T10:00:00.000Z',
  items: [{ orderItemId: 'i1', name: 'Cotton Grey', quantity: 20 }],
};

describe('packingSlip', () => {
  it('lists this shipment only — counterpart, not mill names', () => {
    const lines = packingSlipLines({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
    });
    expect(lines.join('\n')).toMatch(/Jaipur Emporium/);
    expect(lines.join('\n')).toMatch(/Cotton Grey  x 20/);
    expect(lines.join('\n')).not.toMatch(/Ahmedabad/);
  });

  it('adds sku · unit on packing lines when order items are passed', () => {
    const lines = packingSlipLines({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
      orderItems: [
        {
          id: 'i1',
          productId: null,
          name: 'Cotton Grey',
          sku: 'EK-AB12',
          rate: 5000,
          unit: 'mtr',
          image: null,
          images: [],
          quantity: 20,
          requestedQuantity: 20,
          lineStatus: 'confirmed',
          shippedQuantity: 0,
          remainingQuantity: 20,
          note: null,
        },
      ],
    });
    expect(lines.join('\n')).toMatch(/Cotton Grey · EK-AB12 · mtr  x 20/);
  });

  it('builds a PDF header', () => {
    const bytes = packingSlipPdfBytes({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
    });
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toBe('%PDF-1.4');
    expect(
      packingSlipFileName({ orderId: 'cmorderabcdefghijk', counterpartName: 'X', shipment }),
    ).toMatch(/\.pdf$/);
  });
});
