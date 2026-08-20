import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { createSavedItemSchema, type CreateSavedItemDto } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { SavedService } from './saved.service';

@Controller({ path: 'saved', version: '1' })
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get()
  list(@CurrentCompanyId() companyId: string) {
    return this.saved.list(companyId);
  }

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createSavedItemSchema)) dto: CreateSavedItemDto,
  ) {
    return this.saved.create(companyId, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.saved.remove(companyId, id);
  }
}
