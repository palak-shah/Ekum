import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  createOrderSchema,
  dispatchSchema,
  listOrdersQuerySchema,
  quoteOrderSchema,
  type CreateOrderDto,
  type DispatchDto,
  type ListOrdersQuery,
  type QuoteOrderDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { OrderService } from './order.service';

@Controller({ path: 'orders', version: '1' })
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderDto,
  ) {
    return this.orders.create(companyId, dto);
  }

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(listOrdersQuerySchema)) query: ListOrdersQuery,
  ) {
    return this.orders.list(companyId, query);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.orders.get(companyId, id);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.orders.confirm(companyId, id);
  }

  @Post(':id/quote')
  @HttpCode(200)
  quote(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(quoteOrderSchema)) dto: QuoteOrderDto,
  ) {
    return this.orders.quote(companyId, id, dto);
  }

  @Post(':id/accept-quote')
  @HttpCode(200)
  acceptQuote(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.orders.acceptQuote(companyId, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.orders.decline(companyId, id);
  }

  @Post(':id/dispatch')
  @HttpCode(200)
  dispatch(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(dispatchSchema)) dto: DispatchDto,
  ) {
    return this.orders.dispatch(companyId, id, dto);
  }

  @Post(':id/deliver')
  @HttpCode(200)
  deliver(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.orders.deliver(companyId, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.orders.cancel(companyId, id);
  }
}
