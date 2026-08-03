import { Injectable, NotFoundException } from '@nestjs/common';
import type { Address, BillingFirm, CompanySettings, Prisma } from '@prisma/client';
import type {
  AddressView,
  BillingFirmView,
  CompanySettingsView,
  UpdateCompanySettingsDto,
  UpsertAddressDto,
  UpsertBillingFirmDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Addresses ---

  async listAddresses(companyId: string): Promise<AddressView[]> {
    const addresses = await this.prisma.address.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return addresses.map(toAddressView);
  }

  async createAddress(companyId: string, dto: UpsertAddressDto): Promise<AddressView> {
    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({ where: { companyId }, data: { isDefault: false } });
      }
      return tx.address.create({ data: { companyId, ...dto } });
    });
    return toAddressView(address);
  }

  async updateAddress(companyId: string, id: string, dto: UpsertAddressDto): Promise<AddressView> {
    await this.ownedAddress(companyId, id);
    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({ where: { companyId }, data: { isDefault: false } });
      }
      return tx.address.update({ where: { id }, data: dto });
    });
    return toAddressView(address);
  }

  async deleteAddress(companyId: string, id: string): Promise<void> {
    await this.ownedAddress(companyId, id);
    await this.prisma.address.delete({ where: { id } });
  }

  // --- Billing firms ---

  async listBillingFirms(companyId: string): Promise<BillingFirmView[]> {
    const firms = await this.prisma.billingFirm.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return firms.map(toBillingFirmView);
  }

  async createBillingFirm(companyId: string, dto: UpsertBillingFirmDto): Promise<BillingFirmView> {
    const firm = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.billingFirm.updateMany({ where: { companyId }, data: { isDefault: false } });
      }
      return tx.billingFirm.create({ data: { companyId, ...dto } });
    });
    return toBillingFirmView(firm);
  }

  async updateBillingFirm(
    companyId: string,
    id: string,
    dto: UpsertBillingFirmDto,
  ): Promise<BillingFirmView> {
    await this.ownedBillingFirm(companyId, id);
    const firm = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.billingFirm.updateMany({ where: { companyId }, data: { isDefault: false } });
      }
      return tx.billingFirm.update({ where: { id }, data: dto });
    });
    return toBillingFirmView(firm);
  }

  async deleteBillingFirm(companyId: string, id: string): Promise<void> {
    await this.ownedBillingFirm(companyId, id);
    await this.prisma.billingFirm.delete({ where: { id } });
  }

  // --- Company settings ---

  async getSettings(companyId: string): Promise<CompanySettingsView> {
    const settings = await this.prisma.companySettings.findUnique({ where: { companyId } });
    return toSettingsView(settings);
  }

  async updateSettings(
    companyId: string,
    dto: UpdateCompanySettingsDto,
  ): Promise<CompanySettingsView> {
    const tradeDefaults = dto.tradeDefaults as Prisma.InputJsonValue | undefined;
    const myTools = dto.myTools as Prisma.InputJsonValue | undefined;
    const settings = await this.prisma.companySettings.upsert({
      where: { companyId },
      create: {
        companyId,
        returnPolicy: dto.returnPolicy ?? null,
        tradeDefaults,
        myTools,
      },
      update: {
        returnPolicy: dto.returnPolicy,
        tradeDefaults,
        myTools,
      },
    });
    return toSettingsView(settings);
  }

  private async ownedAddress(companyId: string, id: string): Promise<void> {
    const found = await this.prisma.address.findFirst({ where: { id, companyId } });
    if (!found) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Address not found.' });
    }
  }

  private async ownedBillingFirm(companyId: string, id: string): Promise<void> {
    const found = await this.prisma.billingFirm.findFirst({ where: { id, companyId } });
    if (!found) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Billing firm not found.' });
    }
  }
}

function toAddressView(address: Address): AddressView {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: address.isDefault,
  };
}

function toBillingFirmView(firm: BillingFirm): BillingFirmView {
  return {
    id: firm.id,
    name: firm.name,
    gstNumber: firm.gstNumber,
    addressLine: firm.addressLine,
    isDefault: firm.isDefault,
  };
}

function toSettingsView(settings: CompanySettings | null): CompanySettingsView {
  return {
    returnPolicy: settings?.returnPolicy ?? null,
    tradeDefaults: (settings?.tradeDefaults as Record<string, unknown>) ?? {},
    myTools: (settings?.myTools as Record<string, boolean>) ?? {},
  };
}
