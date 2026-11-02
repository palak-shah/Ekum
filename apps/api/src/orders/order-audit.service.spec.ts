import { describe, expect, it, vi } from 'vitest';
import { OrderAuditKind } from '@ekum/domain-types';
import { OrderAuditService } from './order-audit.service';

describe('OrderAuditService.appendQty', () => {
  it('inserts one report row per line and skips no-op edits', async () => {
    const executeRaw = vi.fn(async () => 1);
    const service = new OrderAuditService({
      $transaction: async (ops: Array<Promise<number>>) => Promise.all(ops),
      $executeRaw: executeRaw,
    } as never);

    await service.appendQty({
      orderId: 'ord-1',
      manualOrderNo: 'PO-9',
      statusAt: 'part_shipped',
      actorCompanyId: 'seller',
      actorCompanyName: 'Surat Silk House',
      actorUserId: 'u1',
      kind: OrderAuditKind.SellerEdit,
      rows: [
        {
          orderItemId: 'oi1',
          itemName: 'Cotton Lawn',
          sku: 'CL-1',
          unit: 'set',
          qtyBefore: 50,
          qtyAfter: 45,
        },
        {
          orderItemId: 'oi2',
          itemName: 'Skip me',
          qtyBefore: 10,
          qtyAfter: 10,
        },
      ],
    });

    expect(executeRaw).toHaveBeenCalledTimes(1);
    const sql = executeRaw.mock.calls[0]![0] as { strings: string[]; values: unknown[] };
    expect(sql.strings.join('')).toContain('OrderAudit');
    expect(sql.values).toContain('Seller changed qty · 50 → 45');
    expect(sql.values).toContain(-5);
  });

  it('keeps same-qty confirm snapshots', async () => {
    const executeRaw = vi.fn(async () => 1);
    const service = new OrderAuditService({
      $transaction: async (ops: Array<Promise<number>>) => Promise.all(ops),
      $executeRaw: executeRaw,
    } as never);
    await service.appendQty({
      orderId: 'ord-1',
      statusAt: 'confirmed',
      actorCompanyId: 'seller',
      actorCompanyName: 'Ravi',
      actorUserId: 'u1',
      kind: OrderAuditKind.Confirmed,
      keepSameQty: true,
      rows: [{ orderItemId: 'oi1', itemName: 'Cotton', qtyBefore: 40, qtyAfter: 40 }],
    });
    expect(executeRaw).toHaveBeenCalledTimes(1);
    const sql = executeRaw.mock.calls[0]![0] as { values: unknown[] };
    expect(sql.values).toContain('Confirmed · 40');
  });

  it('inserts on the passed tx and does not start a nested transaction', async () => {
    const nestedTx = vi.fn();
    const prismaExecute = vi.fn(async () => 1);
    const txExecute = vi.fn(async () => 1);
    const service = new OrderAuditService({
      $transaction: nestedTx,
      $executeRaw: prismaExecute,
    } as never);

    await service.appendQty({
      orderId: 'ord-1',
      statusAt: 'requested',
      actorCompanyId: 'buyer',
      actorCompanyName: 'Jaipur Emporium',
      actorUserId: 'u1',
      kind: OrderAuditKind.AmendedRemoved,
      rows: [
        {
          orderItemId: 'oi-gone',
          itemName: 'Cotton Lawn',
          sku: 'CL-1',
          unit: 'pc',
          qtyBefore: 12,
          qtyAfter: 0,
        },
      ],
      tx: { $executeRaw: txExecute },
    });

    expect(nestedTx).not.toHaveBeenCalled();
    expect(prismaExecute).not.toHaveBeenCalled();
    expect(txExecute).toHaveBeenCalledTimes(1);
    const sql = txExecute.mock.calls[0]![0] as { values: unknown[] };
    expect(sql.values).toContain('Buyer removed · Cotton Lawn · 12');
    expect(sql.values).toContain('amended_removed');
  });

  it('rejects the caller when the passed tx insert throws', async () => {
    const nestedTx = vi.fn();
    const service = new OrderAuditService({
      $transaction: nestedTx,
      $executeRaw: vi.fn(),
    } as never);

    await expect(
      service.appendQty({
        orderId: 'ord-1',
        statusAt: 'confirmed',
        actorCompanyId: 'seller',
        actorCompanyName: 'Ravi',
        actorUserId: 'u1',
        kind: OrderAuditKind.Restored,
        rows: [{ orderItemId: 'oi1', itemName: 'Cotton', qtyBefore: 20, qtyAfter: 30 }],
        tx: {
          $executeRaw: vi.fn(async () => {
            throw new Error('insert failed');
          }),
        },
      }),
    ).rejects.toThrow('insert failed');
    expect(nestedTx).not.toHaveBeenCalled();
  });
});
