import { describe, expect, it } from 'vitest';
import { OrderLineStatus, OrderTrailType } from '@ekum/domain-types';
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
        update: async () => ({}),
      },
      order: {
        findUnique: async () => null,
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

describe('OrderTrailService heal bare Quoted', () => {
  it('rewrites legacy Quoted rows to Quoted / Quote updated with totals', async () => {
    const rows = [
      {
        id: 'q1',
        type: OrderTrailType.Quoted,
        at: new Date('2026-09-01T10:00:00Z'),
        actorCompanyId: 'seller',
        actorUserId: 'u1',
        summary: null,
        detail: null,
        note: null,
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
      },
      {
        id: 'q2',
        type: OrderTrailType.Quoted,
        at: new Date('2026-09-01T11:00:00Z'),
        actorCompanyId: 'seller',
        actorUserId: 'u1',
        summary: 'Quoted',
        detail: null,
        note: null,
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
      },
    ];
    const updates: { id: string; summary: string }[] = [];
    const prisma = {
      orderTrailEvent: {
        findMany: async () => rows,
        update: async (args: { where: { id: string }; data: { summary: string } }) => {
          updates.push({ id: args.where.id, summary: args.data.summary });
          const row = rows.find((r) => r.id === args.where.id);
          if (row) row.summary = args.data.summary;
          return row;
        },
      },
      order: {
        findUnique: async () => ({
          items: [
            {
              rate: { toNumber: () => 100 },
              quantity: { toNumber: () => 20 },
              lineStatus: OrderLineStatus.Open,
            },
          ],
        }),
      },
    };
    const service = new OrderTrailService(prisma as never);
    const view = await service.listForViewer('o1', 'buyer', {
      buyerName: 'Buyer',
      sellerName: 'Seller',
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'seller',
      staffByUserId: new Map(),
    });
    expect(view.map((step) => step.summary)).toEqual([
      'Quoted — ₹2,000',
      'Quote updated — ₹2,000',
    ]);
    expect(updates).toHaveLength(2);
  });
});
