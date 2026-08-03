import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Broadcast, Company } from '@prisma/client';
import { MessageType, type BroadcastView, type SendBroadcastDto } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { CompanySerializer } from '../access/company.serializer';
import { DomainEvents } from '../events/events.module';

/**
 * Broadcast (Phase 1): compose once and send now. Recipients come from an
 * explicit selection and/or saved lists; delivery is filtered to actively
 * connected businesses and silently drops anyone who has blocked the sender.
 */
@Injectable()
export class BroadcastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly serializer: CompanySerializer,
    private readonly events: DomainEvents,
  ) {}

  async send(companyId: string, dto: SendBroadcastDto): Promise<BroadcastView> {
    const candidateIds = await this.resolveCandidates(companyId, dto);
    if (candidateIds.length === 0) {
      throw new BadRequestException({
        code: 'NO_RECIPIENTS',
        message: 'Pick at least one recipient or a non-empty list.',
      });
    }

    await this.assertReferenceOwned(companyId, dto);

    const eligibleIds = await this.filterConnected(companyId, candidateIds);
    if (eligibleIds.length === 0) {
      throw new BadRequestException({
        code: 'NO_CONNECTED_RECIPIENTS',
        message: 'None of the selected businesses are connected with you.',
      });
    }

    const broadcast = await this.prisma.broadcast.create({
      data: {
        senderCompanyId: companyId,
        type: dto.type,
        subject: dto.subject,
        body: dto.body ?? null,
        referenceId: dto.referenceId ?? null,
        recipients: { create: eligibleIds.map((recipientCompanyId) => ({ recipientCompanyId })) },
      },
    });

    this.events.broadcastSent({
      broadcastId: broadcast.id,
      senderCompanyId: companyId,
      recipientCompanyIds: eligibleIds,
      subject: dto.subject,
    });

    const companies = await this.prisma.company.findMany({ where: { id: { in: eligibleIds } } });
    return this.toView(broadcast, companies);
  }

  private async resolveCandidates(companyId: string, dto: SendBroadcastDto): Promise<string[]> {
    const lists = dto.listIds.length
      ? await this.prisma.broadcastList.findMany({
          where: { id: { in: dto.listIds }, companyId },
          select: { memberCompanyIds: true },
        })
      : [];
    const fromLists = lists.flatMap((list) => list.memberCompanyIds);
    return [...new Set([...dto.recipientCompanyIds, ...fromLists])].filter((id) => id !== companyId);
  }

  private async filterConnected(companyId: string, candidateIds: string[]): Promise<string[]> {
    const eligible: string[] = [];
    for (const recipientId of candidateIds) {
      if (await this.visibility.isBlocked(companyId, recipientId)) {
        continue; // The recipient has blocked us — drop silently.
      }
      const connected =
        (await this.visibility.canViewCatalog(companyId, recipientId)) ||
        (await this.visibility.canViewCatalog(recipientId, companyId));
      if (connected) {
        eligible.push(recipientId);
      }
    }
    return eligible;
  }

  private async assertReferenceOwned(companyId: string, dto: SendBroadcastDto): Promise<void> {
    if (!dto.referenceId) {
      return;
    }
    if (dto.type === MessageType.ProductCard) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.referenceId, companyId },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException({ code: 'INVALID_REFERENCE', message: 'Product not found.' });
      }
    } else if (dto.type === MessageType.CollectionCard) {
      const collection = await this.prisma.collection.findFirst({
        where: { id: dto.referenceId, companyId },
        select: { id: true },
      });
      if (!collection) {
        throw new NotFoundException({
          code: 'INVALID_REFERENCE',
          message: 'Collection not found.',
        });
      }
    }
  }

  private toView(broadcast: Broadcast, companies: Company[]): BroadcastView {
    return {
      id: broadcast.id,
      type: broadcast.type,
      subject: broadcast.subject,
      body: broadcast.body,
      referenceId: broadcast.referenceId,
      recipientCount: companies.length,
      recipients: companies.map((company) => this.serializer.toPublicSummary(company)),
      createdAt: broadcast.createdAt.toISOString(),
    };
  }
}
