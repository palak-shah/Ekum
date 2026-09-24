import { BadRequestException, Injectable } from '@nestjs/common';
import {
  type CreatePaymentRequestDto,
  type PaymentRequestView,
} from '@ekum/domain-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

const DISABLED = {
  code: 'PAYMENT_DISABLED',
  message: 'Payment asks are not available.',
} as const;

/** Payment asks are deferred — order completes on dispatch. Endpoints stay mounted but reject. */
@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  toView(row: {
    id: string;
    orderId: string;
    amount: Prisma.Decimal | number;
    note: string | null;
    noteVoiceUrl?: string | null;
    noteVoiceDurationMs?: number | null;
    instructions: string | null;
    status: string;
    seenAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
  }): PaymentRequestView {
    const amount = typeof row.amount === 'number' ? row.amount : row.amount.toNumber();
    return {
      id: row.id,
      orderId: row.orderId,
      amount,
      note: row.note,
      noteVoiceUrl: row.noteVoiceUrl ?? null,
      noteVoiceDurationMs: row.noteVoiceDurationMs ?? null,
      instructions: row.instructions,
      status: row.status,
      seenAt: row.seenAt ? row.seenAt.toISOString() : null,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listForOrder(orderId: string): Promise<PaymentRequestView[]> {
    const rows = await this.prisma.paymentRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toView(row));
  }

  async create(
    _actorCompanyId: string,
    _userId: string,
    _orderId: string,
    _dto: CreatePaymentRequestDto,
  ): Promise<PaymentRequestView> {
    throw new BadRequestException(DISABLED);
  }

  async seen(_actorCompanyId: string, _id: string): Promise<PaymentRequestView> {
    throw new BadRequestException(DISABLED);
  }

  async paid(_actorCompanyId: string, _id: string): Promise<PaymentRequestView> {
    throw new BadRequestException(DISABLED);
  }

  async received(_actorCompanyId: string, _id: string): Promise<PaymentRequestView> {
    throw new BadRequestException(DISABLED);
  }
}
