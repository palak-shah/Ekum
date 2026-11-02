import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { orderAuditQtySummary } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

export type OrderAuditQtyRow = {
  orderItemId: string | null;
  itemName: string;
  sku?: string | null;
  unit?: string | null;
  qtyBefore: number | null;
  qtyAfter: number;
};

export type OrderAuditClient = Pick<Prisma.TransactionClient, '$executeRaw'>;

export type AppendQtyAuditInput = {
  orderId: string;
  manualOrderNo?: string | null;
  statusAt: string;
  actorCompanyId: string | null;
  actorCompanyName: string | null;
  actorUserId: string | null;
  kind: string;
  rows: OrderAuditQtyRow[];
  at?: Date;
  /** When true, write even if before === after (place / confirm snapshot). */
  keepSameQty?: boolean;
  /** When set, insert on this client and do not start a nested transaction. */
  tx?: OrderAuditClient;
};

@Injectable()
export class OrderAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async appendQty(input: AppendQtyAuditInput): Promise<void> {
    const keepSame = input.keepSameQty === true;
    const rows = input.rows.filter((row) => {
      if (!Number.isFinite(row.qtyAfter)) return false;
      if (row.qtyBefore == null) return true;
      if (keepSame) return true;
      return row.qtyBefore !== row.qtyAfter;
    });
    if (rows.length < 1) return;
    const at = input.at ?? new Date();
    const manualOrderNo = input.manualOrderNo?.trim() || null;
    const actorCompanyName = input.actorCompanyName?.trim() || null;
    const inserts = rows.map((row) =>
      Prisma.sql`
            INSERT INTO "OrderAudit" (
              "id", "orderId", "orderItemId", "manualOrderNo", "itemName", "sku", "unit",
              "actorCompanyName", "kind", "summary", "qtyBefore", "qtyAfter", "qtyDelta",
              "statusAt", "at", "actorCompanyId", "actorUserId"
            ) VALUES (
              ${randomUUID()},
              ${input.orderId},
              ${row.orderItemId},
              ${manualOrderNo},
              ${row.itemName},
              ${row.sku?.trim() || null},
              ${row.unit ?? null},
              ${actorCompanyName},
              ${input.kind},
              ${orderAuditQtySummary(input.kind, row.qtyBefore, row.qtyAfter, row.itemName)},
              ${row.qtyBefore},
              ${row.qtyAfter},
              ${row.qtyBefore == null ? null : row.qtyAfter - row.qtyBefore},
              ${input.statusAt},
              ${at},
              ${input.actorCompanyId},
              ${input.actorUserId}
            )
          `,
    );
    if (input.tx) {
      for (const sql of inserts) {
        await input.tx.$executeRaw(sql);
      }
      return;
    }
    await this.prisma.$transaction(inserts.map((sql) => this.prisma.$executeRaw(sql)));
  }
}

export function auditQtyNumber(
  value: { toNumber: () => number } | number | null | undefined,
): number | null {
  if (value == null) return null;
  return typeof value === 'object' && 'toNumber' in value ? value.toNumber() : Number(value);
}
