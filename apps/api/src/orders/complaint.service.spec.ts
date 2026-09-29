import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus } from '@ekum/domain-types';
import { ComplaintService } from './complaint.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';

describe('ComplaintService', () => {
  it('creates an open complaint against the counterparty', async () => {
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'cmp-1',
      ...data,
    }));
    const prisma = {
      order: {
        findUnique: async () => ({
          id: 'ord-1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
        }),
      },
      complaint: { create },
    } as unknown as PrismaService;
    const serializer = {
      toComplaintView: (row: unknown) => row,
    } as unknown as OrderSerializer;
    const service = new ComplaintService(prisma, serializer);

    await service.create('buyer', {
      againstCompanyId: 'seller',
      orderId: 'ord-1',
      subject: 'Wrong colour',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          raisedByCompanyId: 'buyer',
          againstCompanyId: 'seller',
          status: ComplaintStatus.Open,
        }),
      }),
    );
  });

  it('404s when the actor is not a party on the order', async () => {
    const prisma = {
      order: {
        findUnique: async () => ({
          id: 'ord-1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
        }),
      },
    } as unknown as PrismaService;
    const service = new ComplaintService(prisma, {
      toComplaintView: (r: unknown) => r,
    } as unknown as OrderSerializer);
    await expect(
      service.create('stranger', {
        againstCompanyId: 'seller',
        orderId: 'ord-1',
        subject: 'X',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets the against party respond, then either party resolve', async () => {
    const update = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'cmp-1',
      raisedByCompanyId: 'buyer',
      againstCompanyId: 'seller',
      status: data.status,
    }));
    let status: string = ComplaintStatus.Open;
    const prisma = {
      complaint: {
        findUnique: async () => ({
          id: 'cmp-1',
          raisedByCompanyId: 'buyer',
          againstCompanyId: 'seller',
          status,
        }),
        update: async (args: { data: Record<string, unknown> }) => {
          status = String(args.data.status);
          return update(args);
        },
      },
    } as unknown as PrismaService;
    const serializer = {
      toComplaintView: (row: unknown) => row,
    } as unknown as OrderSerializer;
    const service = new ComplaintService(prisma, serializer);

    await expect(
      service.respond('buyer', 'cmp-1', { response: 'nope' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await service.respond('seller', 'cmp-1', { response: 'Will replace' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ComplaintStatus.Responded }),
      }),
    );

    await service.resolve('buyer', 'cmp-1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ComplaintStatus.Resolved }),
      }),
    );
  });

  it('creates without an order against the named shop', async () => {
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'cmp-2',
      ...data,
    }));
    const prisma = {
      complaint: { create },
    } as unknown as PrismaService;
    const service = new ComplaintService(prisma, {
      toComplaintView: (row: unknown) => row,
    } as unknown as OrderSerializer);
    await service.create('buyer', { againstCompanyId: 'seller', subject: 'Late lot' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: null,
          againstCompanyId: 'seller',
          images: [],
        }),
      }),
    );
  });

  it('rejects an order that is not with the named shop', async () => {
    const prisma = {
      order: {
        findUnique: async () => ({
          id: 'ord-1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'other',
        }),
      },
    } as unknown as PrismaService;
    const service = new ComplaintService(prisma, {
      toComplaintView: (r: unknown) => r,
    } as unknown as OrderSerializer);
    await expect(
      service.create('buyer', {
        againstCompanyId: 'seller',
        orderId: 'ord-1',
        subject: 'X',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects resolving an already resolved complaint', async () => {
    const prisma = {
      complaint: {
        findUnique: async () => ({
          id: 'cmp-1',
          raisedByCompanyId: 'buyer',
          againstCompanyId: 'seller',
          status: ComplaintStatus.Resolved,
        }),
      },
    } as unknown as PrismaService;
    const service = new ComplaintService(prisma, {
      toComplaintView: (r: unknown) => r,
    } as unknown as OrderSerializer);
    await expect(service.resolve('buyer', 'cmp-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
