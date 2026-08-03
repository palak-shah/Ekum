import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  updateCompanySettingsSchema,
  upsertAddressSchema,
  upsertBillingFirmSchema,
  type UpdateCompanySettingsDto,
  type UpsertAddressDto,
  type UpsertBillingFirmDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { SettingsService } from './settings.service';

@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('addresses')
  listAddresses(@CurrentCompanyId() companyId: string) {
    return this.settings.listAddresses(companyId);
  }

  @Post('addresses')
  createAddress(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(upsertAddressSchema)) dto: UpsertAddressDto,
  ) {
    return this.settings.createAddress(companyId, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(upsertAddressSchema)) dto: UpsertAddressDto,
  ) {
    return this.settings.updateAddress(companyId, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(204)
  deleteAddress(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.settings.deleteAddress(companyId, id);
  }

  @Get('billing-firms')
  listBillingFirms(@CurrentCompanyId() companyId: string) {
    return this.settings.listBillingFirms(companyId);
  }

  @Post('billing-firms')
  createBillingFirm(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(upsertBillingFirmSchema)) dto: UpsertBillingFirmDto,
  ) {
    return this.settings.createBillingFirm(companyId, dto);
  }

  @Patch('billing-firms/:id')
  updateBillingFirm(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(upsertBillingFirmSchema)) dto: UpsertBillingFirmDto,
  ) {
    return this.settings.updateBillingFirm(companyId, id, dto);
  }

  @Delete('billing-firms/:id')
  @HttpCode(204)
  deleteBillingFirm(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.settings.deleteBillingFirm(companyId, id);
  }

  @Get()
  getSettings(@CurrentCompanyId() companyId: string) {
    return this.settings.getSettings(companyId);
  }

  @Put()
  updateSettings(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(updateCompanySettingsSchema)) dto: UpdateCompanySettingsDto,
  ) {
    return this.settings.updateSettings(companyId, dto);
  }
}
