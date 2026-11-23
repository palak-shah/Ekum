import { Injectable, Logger, Optional } from '@nestjs/common';
import { MessageType, RepostPricingMode, ratesEqual } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { DomainEvents } from '../events/events.module';
import { ThreadService } from '../conversation/thread.service';

function asNum(value: { toNumber(): number } | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : value.toNumber();
  return Number.isFinite(n) ? n : null;
}

/**
 * When a supplier Product.rate (or source pack rate) moves off a stamped
 * dependent Edit ownBase, clear the trader's Edit quote and notify.
 * Margin / Same / independent Edit are never cleared.
 */
@Injectable()
export class RepostEditInvalidateService {
  private readonly logger = new Logger(RepostEditInvalidateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: DomainEvents,
    @Optional() private readonly threads?: ThreadService,
  ) {}

  /** After Product.rate changes from oldRate → newRate. */
  async afterProductRateChange(input: {
    productId: string;
    supplierCompanyId: string;
    oldRate: number | null;
    newRate: number | null;
  }): Promise<void> {
    if (ratesEqual(input.oldRate, input.newRate)) return;
    if (input.oldRate == null) return;

    const memberRows = await this.prisma.collectionProduct.findMany({
      where: {
        productId: input.productId,
        pricingMode: RepostPricingMode.Edit,
        editOwnBase: { not: null },
      },
      select: {
        id: true,
        editOwnBase: true,
        collectionId: true,
        collection: {
          select: {
            id: true,
            name: true,
            companyId: true,
            repostPricingMode: true,
            repostEditOwnBase: true,
          },
        },
      },
    });

    const packCandidates = await this.prisma.collection.findMany({
      where: {
        repostPricingMode: RepostPricingMode.Edit,
        repostEditOwnBase: { not: null },
        products: { some: { productId: input.productId, excluded: false } },
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        repostEditOwnBase: true,
      },
    });

    const packsToClear = new Map<
      string,
      { id: string; name: string; companyId: string }
    >();

    for (const row of memberRows) {
      if (!ratesEqual(asNum(row.editOwnBase), input.oldRate)) continue;
      await this.prisma.collectionProduct.update({
        where: { id: row.id },
        data: {
          pricingMode: null,
          marginValue: null,
          editedRate: null,
          editOwnBase: null,
        },
      });
      packsToClear.set(row.collection.id, {
        id: row.collection.id,
        name: row.collection.name,
        companyId: row.collection.companyId,
      });
    }

    for (const pack of packCandidates) {
      if (!ratesEqual(asNum(pack.repostEditOwnBase), input.oldRate)) continue;
      packsToClear.set(pack.id, {
        id: pack.id,
        name: pack.name,
        companyId: pack.companyId,
      });
    }

    for (const pack of packsToClear.values()) {
      await this.clearPackEditAndNotify({
        collectionId: pack.id,
        collectionName: pack.name,
        curatorCompanyId: pack.companyId,
        supplierCompanyId: input.supplierCompanyId,
      });
    }
  }

  /** After a source Collection.rate changes (children keyed by that source). */
  async afterSourceCollectionRateChange(input: {
    sourceCollectionId: string;
    supplierCompanyId: string;
    oldRate: number | null;
    newRate: number | null;
  }): Promise<void> {
    if (ratesEqual(input.oldRate, input.newRate)) return;
    if (input.oldRate == null) return;

    const children = await this.prisma.collection.findMany({
      where: {
        repostSourceCollectionId: input.sourceCollectionId,
        repostPricingMode: RepostPricingMode.Edit,
        repostEditOwnBase: { not: null },
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        repostEditOwnBase: true,
      },
    });

    for (const child of children) {
      if (!ratesEqual(asNum(child.repostEditOwnBase), input.oldRate)) continue;
      await this.clearPackEditAndNotify({
        collectionId: child.id,
        collectionName: child.name,
        curatorCompanyId: child.companyId,
        supplierCompanyId: input.supplierCompanyId,
      });
    }
  }

  private async clearPackEditAndNotify(input: {
    collectionId: string;
    collectionName: string;
    curatorCompanyId: string;
    supplierCompanyId: string;
  }): Promise<void> {
    await this.prisma.collection.update({
      where: { id: input.collectionId },
      data: {
        repostEditedRate: null,
        repostEditOwnBase: null,
        // Keep mode=edit so reopen still shows Edit with empty ₹ + banner.
      },
    });
    await this.prisma.collectionProduct.updateMany({
      where: {
        collectionId: input.collectionId,
        pricingMode: RepostPricingMode.Edit,
      },
      data: {
        pricingMode: null,
        marginValue: null,
        editedRate: null,
        editOwnBase: null,
      },
    });

    this.events.repostEditRateInvalidated({
      collectionId: input.collectionId,
      collectionName: input.collectionName,
      curatorCompanyId: input.curatorCompanyId,
      supplierCompanyId: input.supplierCompanyId,
    });

    await this.postSupplierSystemLine(input).catch((err) => {
      this.logger.warn(
        `repost edit chat line failed for ${input.collectionId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });
  }

  private async postSupplierSystemLine(input: {
    collectionId: string;
    collectionName: string;
    curatorCompanyId: string;
    supplierCompanyId: string;
  }): Promise<void> {
    if (!this.threads) return;
    if (input.curatorCompanyId === input.supplierCompanyId) return;

    const threadId = await this.threads.ensureTradeThread(
      input.curatorCompanyId,
      input.supplierCompanyId,
    );
    const companies = await this.prisma.company.findMany({
      where: { id: { in: [input.supplierCompanyId, input.curatorCompanyId] } },
      select: { id: true, name: true },
    });
    const supplierName =
      companies.find((c) => c.id === input.supplierCompanyId)?.name?.trim() || 'Supplier';
    const packName = input.collectionName.trim() || 'your collection';
    const body = `${supplierName} changed rates for ${packName} — set your rate again.`;

    await this.prisma.message.create({
      data: {
        threadId,
        senderCompanyId: input.supplierCompanyId,
        type: MessageType.System,
        body,
        metadata: {
          kind: 'repost_edit_rate_invalidated',
          collectionId: input.collectionId,
          collectionName: packName,
          supplierCompanyId: input.supplierCompanyId,
          curatorCompanyId: input.curatorCompanyId,
          path: `/collections/${input.collectionId}`,
        },
      },
    });
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
  }
}
