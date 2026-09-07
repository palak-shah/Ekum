import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  amendOrderSchema,
  cancelOrderSchema,
  createForBuyerSchema,
  createOrderSchema,
  createOrdersBatchSchema,
  createOrdersFromPackSchema,
  decideOrderLinesSchema,
  declineOrderSchema,
  dispatchSchema,
  listOrdersQuerySchema,
  quoteOrderSchema,
  millPassHoldSchema,
  sendUpOrderSchema,
  settleOrderSchema,
  type AmendOrderDto,
  type CancelOrderDto,
  type CreateForBuyerDto,
  type CreateOrderDto,
  type CreateOrdersBatchDto,
  type CreateOrdersFromPackDto,
  type DecideOrderLinesDto,
  type DeclineOrderDto,
  type DispatchDto,
  type ListOrdersQuery,
  type QuoteOrderDto,
  type MillPassHoldDto,
  type SendUpOrderDto,
  type SettleOrderDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RequirePermission } from '../auth/require-permission';
import { OrderService } from './order.service';
import { BuyForBuyerService } from './buy-for-buyer.service';

@Controller({ path: 'orders', version: '1' })
export class OrderController {
  constructor(
    private readonly orders: OrderService,
    private readonly forBuyer: BuyForBuyerService,
  ) {}

  @Post()
  @RequirePermission('orders')
  create(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderDto,
  ) {
    return this.orders.create(companyId, user.userId, dto);
  }

  @Post('batch')
  @HttpCode(200)
  @RequirePermission('orders')
  createBatch(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createOrdersBatchSchema)) dto: CreateOrdersBatchDto,
  ) {
    return this.orders.createBatch(companyId, user.userId, dto);
  }

  @Post('for-buyer')
  @RequirePermission('orders')
  createForBuyer(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createForBuyerSchema)) dto: CreateForBuyerDto,
  ) {
    return this.forBuyer.create(companyId, user.userId, dto);
  }

  @Post('from-pack')
  @HttpCode(200)
  @RequirePermission('orders')
  createFromPack(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createOrdersFromPackSchema)) dto: CreateOrdersFromPackDto,
  ) {
    return this.orders.createFromPack(companyId, user.userId, dto);
  }

  @Post(':id/amend')
  @HttpCode(200)
  @RequirePermission('orders')
  amend(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(amendOrderSchema)) dto: AmendOrderDto,
  ) {
    return this.orders.amend(companyId, user.userId, id, dto);
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
  @RequirePermission('orders')
  confirm(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.orders.confirm(companyId, user.userId, id);
  }

  @Post(':id/quote')
  @HttpCode(200)
  @RequirePermission('orders')
  quote(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(quoteOrderSchema)) dto: QuoteOrderDto,
  ) {
    return this.orders.quote(companyId, user.userId, id, dto);
  }

  @Post(':id/lines/decide')
  @HttpCode(200)
  @RequirePermission('orders')
  decideLines(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(decideOrderLinesSchema)) dto: DecideOrderLinesDto,
  ) {
    return this.orders.decideLines(companyId, user.userId, id, dto);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @RequirePermission('orders')
  acceptLogged(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.forBuyer.acceptLogged(companyId, user.userId, id);
  }

  @Post(':id/accept-quote')
  @HttpCode(200)
  @RequirePermission('orders')
  acceptQuote(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.orders.acceptQuote(companyId, user.userId, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  @RequirePermission('orders')
  decline(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(declineOrderSchema)) dto: DeclineOrderDto,
  ) {
    return this.orders.decline(companyId, user.userId, id, dto);
  }

  @Post(':id/dispatch')
  @HttpCode(200)
  @RequirePermission('orders')
  dispatch(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(dispatchSchema)) dto: DispatchDto,
  ) {
    return this.orders.dispatch(companyId, user.userId, id, dto);
  }

  @Post(':id/settle')
  @HttpCode(200)
  @RequirePermission('orders')
  settle(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(settleOrderSchema)) dto: SettleOrderDto,
  ) {
    return this.orders.settle(companyId, user.userId, id, dto);
  }

  @Post(':id/deliver')
  @HttpCode(200)
  @RequirePermission('orders')
  deliver(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.orders.deliver(companyId, user.userId, id);
  }

  @Post(':id/send-up')
  @HttpCode(200)
  @RequirePermission('orders')
  sendUp(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendUpOrderSchema)) dto: SendUpOrderDto,
  ) {
    return this.orders.sendUp(companyId, user.userId, id, dto);
  }

  @Post(':id/mill-hold')
  @HttpCode(200)
  @RequirePermission('orders')
  millHold(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(millPassHoldSchema)) dto: MillPassHoldDto,
  ) {
    return this.orders.millPassHold(companyId, user.userId, id, dto);
  }

  @Post(':id/take-control')
  @HttpCode(200)
  @RequirePermission('orders')
  takeControl(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.orders.takeControl(companyId, user.userId, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @RequirePermission('orders')
  cancel(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(cancelOrderSchema)) dto: CancelOrderDto,
  ) {
    return this.orders.cancel(companyId, user.userId, id, dto);
  }
}
