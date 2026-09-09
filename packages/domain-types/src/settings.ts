import { z } from 'zod';
import { orderPathPreferenceValues } from './enums';

/**
 * Settings reference data owned by a company: dispatch addresses, billing firms
 * (a company may bill under more than one GST firm), and trade defaults. These
 * feed order building and dispatch later; here they are plain owner-managed
 * reference data.
 */

export const upsertAddressSchema = z.object({
  label: z.string().trim().min(1).max(60),
  line1: z.string().trim().min(1).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().max(80).optional(),
  pincode: z.string().trim().max(12).optional(),
  isDefault: z.boolean().default(false),
});
export type UpsertAddressDto = z.infer<typeof upsertAddressSchema>;

export const upsertBillingFirmSchema = z.object({
  name: z.string().trim().min(1).max(160),
  gstNumber: z.string().trim().max(20).optional(),
  addressLine: z.string().trim().max(240).optional(),
  isDefault: z.boolean().default(false),
});
export type UpsertBillingFirmDto = z.infer<typeof upsertBillingFirmSchema>;

/** Free-form-but-bounded trade defaults and "My Tools" toggles. */
export const updateCompanySettingsSchema = z.object({
  returnPolicy: z.string().trim().max(2000).nullable().optional(),
  tradeDefaults: z.record(z.string(), z.unknown()).optional(),
  myTools: z.record(z.string(), z.boolean()).optional(),
  /** Profile toggles — merged into tradeDefaults (buy/sell default on; trading product-default off). */
  buyingEnabled: z.boolean().optional(),
  sellingEnabled: z.boolean().optional(),
  tradingEnabled: z.boolean().optional(),
  /** Legacy API: merged into tradeDefaults.orderPathPreference. UI removed — Prefer handle when unset. */
  orderPathPreference: z.enum(orderPathPreferenceValues).optional(),
});
export type UpdateCompanySettingsDto = z.infer<typeof updateCompanySettingsSchema>;

export interface AddressView {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  pincode: string | null;
  isDefault: boolean;
}

export interface BillingFirmView {
  id: string;
  name: string;
  gstNumber: string | null;
  addressLine: string | null;
  isDefault: boolean;
}

export interface CompanySettingsView {
  returnPolicy: string | null;
  tradeDefaults: Record<string, unknown>;
  myTools: Record<string, boolean>;
}
