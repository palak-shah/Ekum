import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplaintStatus,
  MessageType,
  type ComplaintView,
  type CreateComplaintDto,
  type CursorPage,
  type ListComplaintsQuery,
  type RespondComplaintDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
import { OrderSerializer } from './order.serializer';

@Injectable()
export class ComplaintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: OrderSerializer,
  ) {}

  async create(actorCompanyId: string, dto: CreateComplaintDto): Promise<ComplaintView> {
    if (dto.againstCompanyId === actorCompanyId) {
      throw new BadRequestException({
        code: 'INVALID',
        message: 'Pick the other shop.',
      });
    }

    let orderId: string | null = null;
    if (dto.orderId) {
      orderId = await this.resolveOrderIdForAgainst(
        actorCompanyId,
        dto.orderId,
        dto.againstCompanyId,
      );
    }

    let forwardedFromComplaintId: string | null = null;
    if (dto.forwardedFromComplaintId) {
      const source = await this.loadForParty(dto.forwardedFromComplaintId, actorCompanyId);
      if (source.againstCompanyId !== actorCompanyId) {
        throw new ForbiddenException({
          code: 'NOT_ALLOWED',
          message: 'Only the shop the complaint is against can send it to a supplier.',
        });
      }
      forwardedFromComplaintId = source.id;
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        orderId,
        raisedByCompanyId: actorCompanyId,
        againstCompanyId: dto.againstCompanyId,
        subject: dto.subject,
        detail: dto.detail ?? null,
        images: dto.images ?? [],
        status: ComplaintStatus.Open,
        forwardedFromComplaintId,
      },
    });
    return this.serializer.toComplaintView(complaint, actorCompanyId);
  }

  async list(
    actorCompanyId: string,
    query: ListComplaintsQuery,
  ): Promise<CursorPage<ComplaintView>> {
    const args = cursorArgs(query);
    const where = {
      OR: [
        { raisedByCompanyId: actorCompanyId },
        { againstCompanyId: actorCompanyId },
      ],
    };
    const rows = await this.prisma.complaint.findMany({
      where,
      ...args,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    const companyIds = [
      ...new Set(rows.flatMap((row) => [row.raisedByCompanyId, row.againstCompanyId])),
    ];
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(companies.map((c) => [c.id, c.name]));

    const complaintIds = rows.map((row) => row.id);
    const messages =
      complaintIds.length > 0
        ? await this.prisma.message.findMany({
            where: {
              type: MessageType.Complaint,
              referenceId: { in: complaintIds },
            },
            select: { id: true, threadId: true, referenceId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          })
        : [];
    const msgByComplaint = new Map<string, { id: string; threadId: string }>();
    for (const msg of messages) {
      if (!msg.referenceId || msgByComplaint.has(msg.referenceId)) continue;
      msgByComplaint.set(msg.referenceId, { id: msg.id, threadId: msg.threadId });
    }

    return toCursorPage(rows, query.limit, (row) => {
      const base = this.serializer.toComplaintView(row, actorCompanyId);
      const counterpartId =
        row.raisedByCompanyId === actorCompanyId
          ? row.againstCompanyId
          : row.raisedByCompanyId;
      const msg = msgByComplaint.get(row.id);
      return {
        ...base,
        counterpartName: nameById.get(counterpartId) ?? null,
        forwardedFromComplaintId: row.forwardedFromComplaintId,
        messageId: msg?.id ?? null,
        threadId: msg?.threadId ?? null,
      };
    });
  }

  async respond(
    actorCompanyId: string,
    id: string,
    dto: RespondComplaintDto,
  ): Promise<ComplaintView> {
    const complaint = await this.loadForParty(id, actorCompanyId);
    if (complaint.againstCompanyId !== actorCompanyId) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the business a complaint is against can respond.',
      });
    }
    if (complaint.status !== ComplaintStatus.Open) {
      throw this.invalidTransition();
    }
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.Responded,
        response: dto.response,
        respondedAt: new Date(),
      },
    });
    return this.serializer.toComplaintView(updated, actorCompanyId);
  }

  async resolve(actorCompanyId: string, id: string): Promise<ComplaintView> {
    const complaint = await this.loadForParty(id, actorCompanyId);
    if (complaint.status === ComplaintStatus.Resolved) {
      throw this.invalidTransition();
    }
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: { status: ComplaintStatus.Resolved, resolvedAt: new Date() },
    });
    return this.serializer.toComplaintView(updated, actorCompanyId);
  }

  async get(actorCompanyId: string, id: string): Promise<ComplaintView> {
    const complaint = await this.loadForParty(id, actorCompanyId);
    return this.serializer.toComplaintView(complaint, actorCompanyId);
  }

  /**
   * Resolve attachable order for against shop. Prefer direct party match;
   * else rewrite manage-parent → released mill lot when against is that mill.
   */
  private async resolveOrderIdForAgainst(
    actorCompanyId: string,
    orderId: string,
    againstCompanyId: string,
  ): Promise<string> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (
      !order ||
      (order.buyerCompanyId !== actorCompanyId && order.sellerCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    const other =
      order.buyerCompanyId === actorCompanyId ? order.sellerCompanyId : order.buyerCompanyId;
    if (other === againstCompanyId) {
      return order.id;
    }

    const millLot = await this.prisma.order.findFirst({
      where: {
        downstreamOrderId: order.id,
        sellerCompanyId: againstCompanyId,
        buyerCompanyId: actorCompanyId,
        upstreamReleasedAt: { not: null },
      },
      select: { id: true },
    });
    if (millLot) {
      return millLot.id;
    }

    throw new BadRequestException({
      code: 'INVALID',
      message: 'That order is not with this shop.',
    });
  }

  private async loadForParty(id: string, actorCompanyId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (
      !complaint ||
      (complaint.raisedByCompanyId !== actorCompanyId &&
        complaint.againstCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Complaint not found.' });
    }
    return complaint;
  }

  private invalidTransition(): ConflictException {
    return new ConflictException({
      code: 'INVALID_TRANSITION',
      message: 'This complaint cannot change to that state.',
    });
  }
}
