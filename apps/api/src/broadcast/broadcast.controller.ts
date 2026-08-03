import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import {
  sendBroadcastSchema,
  upsertBroadcastListSchema,
  type SendBroadcastDto,
  type UpsertBroadcastListDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { BroadcastService } from './broadcast.service';
import { BroadcastListService } from './broadcast-list.service';

@Controller({ path: 'broadcasts', version: '1' })
export class BroadcastController {
  constructor(
    private readonly broadcasts: BroadcastService,
    private readonly lists: BroadcastListService,
  ) {}

  @Post()
  send(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(sendBroadcastSchema)) dto: SendBroadcastDto,
  ) {
    return this.broadcasts.send(companyId, dto);
  }

  @Get('lists')
  listLists(@CurrentCompanyId() companyId: string) {
    return this.lists.list(companyId);
  }

  @Post('lists')
  createList(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(upsertBroadcastListSchema)) dto: UpsertBroadcastListDto,
  ) {
    return this.lists.create(companyId, dto);
  }

  @Put('lists/:id')
  updateList(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(upsertBroadcastListSchema)) dto: UpsertBroadcastListDto,
  ) {
    return this.lists.update(companyId, id, dto);
  }

  @Delete('lists/:id')
  @HttpCode(200)
  removeList(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.lists.remove(companyId, id);
  }
}
