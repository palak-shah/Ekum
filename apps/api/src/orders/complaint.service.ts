import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplaintStatus,
  type ComplaintView,
  type CreateComplaintDto,
  type RespondComplaintDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { OrderSerializer } from './order.serializer';

@Injectable()
export class ComplaintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: OrderSerializer,
  ) {}

  async create(actorCompanyId: string, dto: CreateComplaintDto): Promise<ComplaintView> {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (
      !order ||
      (order.buyerCompanyId !== actorCompanyId && order.sellerCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    const against =
      order.buyerCompanyId === actorCompanyId ? order.sellerCompanyId : order.buyerCompanyId;

    const complaint = await this.prisma.complaint.create({
      data: {
        orderId: order.id,
        raisedByCompanyId: actorCompanyId,
        againstCompanyId: against,
        subject: dto.subject,
        detail: dto.detail ?? null,
        status: ComplaintStatus.Open,
      },
    });
    return this.serializer.toComplaintView(complaint, actorCompanyId);
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
