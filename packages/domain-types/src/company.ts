import { z } from 'zod';
import { superCategoryValues } from './enums';

/** Capabilities unlock progressively; they are data on a company, never a role. */
export interface CompanyCapabilities {
  publish: boolean;
  relist: boolean;
  refer: boolean;
}

/**
 * Which trade sides the UI should show. Buy/sell default on; trading defaults
 * off in product (WIP may treat unset as on for QA — see resolveTradePresence).
 * Not a role enum — Profile toggles; creating a product/collection forces selling on.
 */
export interface TradePresence {
  buying: boolean;
  selling: boolean;
  /** Curate packs + dual-trade (Manage / facilitator). Not an OTP Trader role. */
  trading: boolean;
}

/** Per-user permissions inside a company (owner-set hard caps). */
export interface CompanyPermissions {
  uploads: boolean;
  chats: boolean;
  orders: boolean;
  payments: boolean;
  team: boolean;
}

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, 'Business name is required').max(120),
  city: z.string().trim().min(1, 'City is required').max(80),
  contactPerson: z.string().trim().min(1, 'Contact person is required').max(120),
  superCategories: z.array(z.enum(superCategoryValues)).min(1).max(5),
  sellCategories: z.array(z.string().trim().min(1)).max(40).default([]),
  buyCategories: z.array(z.string().trim().min(1)).max(40).default([]),
  about: z.string().trim().max(600).optional(),
  gstNumber: z.string().trim().max(20).optional(),
});
export type CreateCompanyDto = z.infer<typeof createCompanySchema>;

/**
 * Profile update. contactPerson updates the acting user's display name (not a
 * company column). canPublish is never set from sellCategories here — it unlocks
 * on first publish consent.
 */
export const updateCompanySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  contactPerson: z.string().trim().min(1).max(120).optional(),
  superCategories: z.array(z.enum(superCategoryValues)).min(1).max(5).optional(),
  sellCategories: z.array(z.string().trim().min(1)).max(40).optional(),
  buyCategories: z.array(z.string().trim().min(1)).max(40).optional(),
  about: z.string().trim().max(600).optional().nullable(),
  gstNumber: z.string().trim().max(20).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;

/**
 * The contact-safe public profile: what any other company may see. It never
 * carries phone/WhatsApp details — contact protection is enforced here, at the
 * serialization boundary, not left to individual screens.
 */
export interface PublicCompanyProfile {
  id: string;
  name: string;
  city: string;
  about: string | null;
  logoUrl: string | null;
  verification: string;
  categories: string[];
  superCategories: string[];
}

/** A public-safe contact point. Phone is masked unless the business opts in. */
export interface CompanyContactPoint {
  name: string;
  role: string | null;
  phone: string | null;
}

/** The owner's full view of their own company. */
export interface OwnCompanyProfile extends PublicCompanyProfile {
  gstNumber: string | null;
  sellCategories: string[];
  buyCategories: string[];
  contactPerson: string | null;
  capabilities: CompanyCapabilities;
  tradePresence: TradePresence;
  role: string;
  permissions: CompanyPermissions;
}
