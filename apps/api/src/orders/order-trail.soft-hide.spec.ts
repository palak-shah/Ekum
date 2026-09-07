import { describe, expect, it } from 'vitest';
import { OrderTrailType } from '@ekum/domain-types';
import { OrderTrailService } from './order-trail.service';

describe('OrderTrailService soft-hide', () => {
  it('scrubs mill shop names from parent trail summaries', async () => {
    const rows = [
      {
        id: 't1',
        type: OrderTrailType.Confirmed,
        at: new Date('2026-09-07T10:00:00Z'),
        actorCompanyId: 'mill',
        actorUserId: null,
        summary: 'Ahmedabad Loom Co confirmed',
        detail: '3 designs',
        note: null,
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
      },
    ];
    const prisma = {
      orderTrailEvent: {
        findMany: async () => rows,
      },
    };
    const service = new OrderTrailService(prisma as never);
    const view = await service.listForViewer('parent', 'buyer', {
      buyerName: 'Meena Textiles',
      sellerName: 'Surat Silk House',
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      upstreamNamesToHide: ['Ahmedabad Loom Co'],
      staffByUserId: new Map(),
    });
    expect(view[0]?.summary).toBe('Surat Silk House confirmed');
    expect(view[0]?.summary).not.toMatch(/Ahmedabad/i);
    expect(view[0]?.who).toBe('Surat Silk House');
    expect(view[0]?.detail).toBe('3 designs');
  });
});
