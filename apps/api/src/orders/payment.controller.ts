import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import {
  createPaymentRequestSchema,
  type CreatePaymentRequestDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RequirePermission } from '../auth/require-permission';
import { PaymentService } from './payment.service';

@Controller({ path: 'orders', version: '1' })
export class OrderPaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post(':id/payment-requests')
  @RequirePermission('payments')
  create(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createPaymentRequestSchema)) dto: CreatePaymentRequestDto,
  ) {
    return this.payments.create(companyId, user.userId, id, dto);
  }
}

@RequirePermission('payments')
@Controller({ path: 'payment-requests', version: '1' })
export class PaymentRequestController {
  constructor(private readonly payments: PaymentService) {}

  @Post(':id/seen')
  @HttpCode(200)
  seen(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.payments.seen(companyId, id);
  }

  @Post(':id/paid')
  @HttpCode(200)
  paid(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.payments.paid(companyId, id);
  }

  @Post(':id/received')
  @HttpCode(200)
  received(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.payments.received(companyId, id);
  }
}
