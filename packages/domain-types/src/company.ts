import { z } from 'zod';

/** Capabilities unlock progressively; they are data on a company, never a role. */
export interface CompanyCapabilities {
  publish: boolean;
  relist: boolean;
  refer: boolean;
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
  contactPerson: z.string().trim().max(120).optional(),
  sellCategories: z.array(z.string().trim().min(1)).max(40).default([]),
  buyCategories: z.array(z.string().trim().min(1)).max(40).default([]),
  about: z.string().trim().max(600).optional(),
  gstNumber: z.string().trim().max(20).optional(),
});
export type CreateCompanyDto = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();
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
  verification: string;
  categories: string[];
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
  capabilities: CompanyCapabilities;
}
