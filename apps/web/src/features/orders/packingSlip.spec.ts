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

  it('builds qty · name · sku · unit rows for the slip table', () => {
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
          quantity: 20,
          requestedQuantity: 20,
          remainingQuantity: 0,
          shippedQuantity: 20,
          lineStatus: 'dispatched',
        } as never,
      ],
    });
    expect(rows).toEqual([
      { quantity: '20', name: 'Cotton Grey', sku: 'CG-01', unit: 'mtr' },
    ]);
  });

  it('builds a printable PDF header with Helvetica-Bold', () => {
    const bytes = packingSlipPdfBytes({
      orderId: 'cmorderabcdefghijk',
      counterpartName: 'Jaipur Emporium',
      shipment,
    });
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text.slice(0, 8)).toBe('%PDF-1.4');
    expect(text).toContain('/BaseFont /Helvetica-Bold');
    expect(text).toContain('PACKING LIST');
    expect(
      packingSlipFileName({ orderId: 'cmorderabcdefghijk', counterpartName: 'X', shipment }),
    ).toMatch(/\.pdf$/);
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
