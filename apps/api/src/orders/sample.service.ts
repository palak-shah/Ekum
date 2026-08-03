import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SampleStatus,
  type CreateSampleDto,
  type CursorPage,
  type CursorPageQuery,
  type SampleDispatchDto,
  type SampleView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
import { OrderSerializer } from './order.serializer';
import { TradeAccess } from './trade-access';

const SAMPLE_RELATIONS = { buyer: true, seller: true } as const;

interface TransitionOptions {
  actor: 'buyer' | 'seller' | 'any';
  from: string[];
  next: string;
  data?: Prisma.SampleUpdateInput;
}

@Injectable()
export class SampleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: OrderSerializer,
    private readonly tradeAccess: TradeAccess,
  ) {}

  async create(actorCompanyId: string, dto: CreateSampleDto): Promise<SampleView> {
    await this.tradeAccess.assertCanTrade(actorCompanyId, dto.sellerCompanyId);
    const sample = await this.prisma.sample.create({
      data: {
        buyerCompanyId: actorCompanyId,
        sellerCompanyId: dto.sellerCompanyId,
        productId: dto.productId ?? null,
        name: dto.name,
        note: dto.note ?? null,
        status: SampleStatus.Requested,
      },
      include: SAMPLE_RELATIONS,
    });
    return this.serializer.toSampleView(sample, actorCompanyId);
  }

  async list(actorCompanyId: string, query: CursorPageQuery): Promise<CursorPage<SampleView>> {
    const rows = await this.prisma.sample.findMany({
      where: { OR: [{ buyerCompanyId: actorCompanyId }, { sellerCompanyId: actorCompanyId }] },
      include: SAMPLE_RELATIONS,
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) =>
      this.serializer.toSampleView(row, actorCompanyId),
    );
  }

  async get(actorCompanyId: string, id: string): Promise<SampleView> {
    const sample = await this.loadForParty(id, actorCompanyId);
    return this.serializer.toSampleView(sample, actorCompanyId);
  }

  dispatch(actorCompanyId: string, id: string, dto: SampleDispatchDto): Promise<SampleView> {
    return this.transition(actorCompanyId, id, {
      actor: 'seller',
      from: [SampleStatus.Requested],
      next: SampleStatus.Dispatched,
      data: {
        dispatchedAt: new Date(),
        transporter: dto.transporter ?? null,
        lrNumber: dto.lrNumber ?? null,
      },
    });
  }

  receive(actorCompanyId: string, id: string): Promise<SampleView> {
    return this.transition(actorCompanyId, id, {
      actor: 'buyer',
      from: [SampleStatus.Dispatched],
      next: SampleStatus.Received,
      data: { receivedAt: new Date() },
    });
  }

  decline(actorCompanyId: string, id: string): Promise<SampleView> {
    return this.transition(actorCompanyId, id, {
      actor: 'seller',
      from: [SampleStatus.Requested],
      next: SampleStatus.Declined,
    });
  }

  convert(actorCompanyId: string, id: string): Promise<SampleView> {
    return this.transition(actorCompanyId, id, {
      actor: 'any',
      from: [SampleStatus.Received],
      next: SampleStatus.Converted,
    });
  }

  private async transition(
    actorCompanyId: string,
    id: string,
    options: TransitionOptions,
  ): Promise<SampleView> {
    const sample = await this.loadForParty(id, actorCompanyId);
    const isBuyer = sample.buyerCompanyId === actorCompanyId;

    if ((options.actor === 'buyer' && !isBuyer) || (options.actor === 'seller' && isBuyer)) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message:
          options.actor === 'seller'
            ? 'Only the seller can do this.'
            : 'Only the buyer can do this.',
      });
    }
    if (!options.from.includes(sample.status)) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `A sample that is ${sample.status} cannot move to ${options.next}.`,
      });
    }

    const updated = await this.prisma.sample.update({
      where: { id },
      data: { status: options.next, ...options.data },
      include: SAMPLE_RELATIONS,
    });
    return this.serializer.toSampleView(updated, actorCompanyId);
  }

  private async loadForParty(id: string, actorCompanyId: string) {
    const sample = await this.prisma.sample.findUnique({
      where: { id },
      include: SAMPLE_RELATIONS,
    });
    if (
      !sample ||
      (sample.buyerCompanyId !== actorCompanyId && sample.sellerCompanyId !== actorCompanyId)
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Sample not found.' });
    }
    return sample;
  }
}
