import { describe, expect, it, vi } from 'vitest';
import {
  packingSlipFileName,
  packingSlipLines,
  packingSlipPdfBytes,
  openPackingSlipPdf,
  packingSlipRows,
} from './packingSlip';

const shipment = {
  id: 's1',
  transporter: 'VRL',
  lrNumber: 'LR-1',
  parcelCount: 2,
  dispatchedAt: '2026-09-21T10:00:00.000Z',
  items: [{ orderItemId: 'i1', name: 'Cotton Grey', quantity: 20 }],
  legs: [{ id: 'leg1', lrNumber: 'LR-1', billNumber: null as string | null, sortOrder: 0 }],
};

describe('packingSlip', () => {
  it('lists this shipment only — counterpart, not mill names', () => {
    const lines = packingSlipLines({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
    });
    expect(lines.join('\n')).toMatch(/Jaipur Emporium/);
    expect(lines.join('\n')).toMatch(/PACKING LIST/);
    expect(lines.join('\n')).toMatch(/LR: LR-1/);
    expect(lines.join('\n')).toMatch(/Transporter: VRL/);
    expect(lines.join('\n')).toMatch(/Parcels: 2/);
    expect(lines.join('\n')).not.toMatch(/Mill|Ahmedabad/);
    expect(lines.some((line) => line.includes('Cotton Grey'))).toBe(true);
  });

  it('omits buyer when showBuyer is off', () => {
    const lines = packingSlipLines({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
      options: { showBuyer: false },
    });
    expect(lines.join('\n')).not.toMatch(/Jaipur Emporium/);
    expect(lines.join('\n')).toMatch(/PACKING LIST/);
  });

  it('lists each LR + bill pair in the header', () => {
    const lines = packingSlipLines({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment: {
        ...shipment,
        legs: [
          { id: 'a', lrNumber: 'LR-1', billNumber: 'B-1', sortOrder: 0 },
          { id: 'b', lrNumber: 'LR-2', billNumber: null, sortOrder: 1 },
        ],
      },
    });
    expect(lines.join('\n')).toMatch(/LR: LR-1  Bill: B-1/);
    expect(lines.join('\n')).toMatch(/LR: LR-2/);
  });

  it('builds qty in the order unit · name · sku rows', () => {
    const rows = packingSlipRows({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
      orderItems: [
        {
          id: 'i1',
          name: 'Cotton Grey',
          sku: 'CG-01',
          unit: 'mtr',
          image: 'https://example.com/a.jpg',
          images: [],
          quantity: 20,
          requestedQuantity: 20,
          remainingQuantity: 0,
          shippedQuantity: 20,
          lineStatus: 'dispatched',
        } as never,
      ],
    });
    expect(rows).toEqual([
      {
        quantity: '20 mtr',
        name: 'Cotton Grey',
        sku: 'CG-01',
        imageUrl: 'https://example.com/a.jpg',
      },
    ]);
  });

  it('builds a printable PDF header with Helvetica-Bold', async () => {
    const bytes = await packingSlipPdfBytes({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
      options: { showPhotos: false },
    });
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text.slice(0, 8)).toBe('%PDF-1.4');
    expect(text).toContain('/BaseFont /Helvetica-Bold');
    expect(text).toContain('PACKING LIST');
    expect(text).toContain('To: Jaipur Emporium');
    expect(
      packingSlipFileName({ orderId: 'cmorderabcdefghijk', counterpartName: 'X', shipment }),
    ).toMatch(/\.pdf$/);
  });

  it('hides buyer line in the PDF when asked', async () => {
    const bytes = await packingSlipPdfBytes({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
      options: { showBuyer: false, showPhotos: false },
    });
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('PACKING LIST');
    expect(text).not.toContain('To: Jaipur Emporium');
  });

  it('opens in a new tab for the phone PDF viewer; downloads when blocked', () => {
    const create = vi.fn(() => 'blob:slip');
    const revoke = vi.fn();
    const open = vi.fn(() => ({ focus: vi.fn() }));
    vi.stubGlobal('URL', { ...URL, createObjectURL: create, revokeObjectURL: revoke });
    vi.stubGlobal('open', open);
    const file = new File([new Uint8Array([1, 2, 3])], 'slip.pdf', { type: 'application/pdf' });
    expect(openPackingSlipPdf(file)).toBe('opened');
    expect(open).toHaveBeenCalledWith('blob:slip', '_blank', 'noopener,noreferrer');

    open.mockReturnValueOnce(null);
    const click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      rel: '',
      click,
    } as unknown as HTMLAnchorElement);
    expect(openPackingSlipPdf(file)).toBe('downloaded');
    expect(click).toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
