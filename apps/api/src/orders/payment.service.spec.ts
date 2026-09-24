import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { suggestedPaymentAmount } from '@ekum/domain-types';
import { PaymentService } from './payment.service';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('suggestedPaymentAmount', () => {
  it('sums rate × qty when every line has a rate', () => {
    expect(
      suggestedPaymentAmount([
        { rate: 10, quantity: 2 },
        { rate: 5, quantity: 1 },
      ]),
    ).toBe(25);
  });

  it('returns 0 when any line is missing a rate', () => {
    expect(suggestedPaymentAmount([{ rate: 10, quantity: 2 }, { quantity: 1 }])).toBe(0);
  });
});

describe('PaymentService', () => {
  const svc = new PaymentService({} as PrismaService);

  it('rejects create — payment asks disabled', async () => {
    await expect(svc.create('seller', 'u1', 'o1', { amount: 100 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects paid / received / seen', async () => {
    await expect(svc.paid('buyer', 'ask1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.received('seller', 'ask1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.seen('buyer', 'ask1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
