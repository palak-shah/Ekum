import { z } from 'zod';
import { BUSINESS_SHOWCASE_MAX, profileVisibilityValues } from './enums';
import {
  masterCategorySlugValues,
  migrateSuperCategoriesToMaster,
} from './master-categories';
import {
  normalizeWebsiteUrl,
  shopHoursAreSameDay,
  SHOP_WEEKDAYS,
  type ShopAddress,
  type ShopWorkingHours,
} from './company-business-info';

const shopHhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.');
const shopWeekdaySchema = z.enum(SHOP_WEEKDAYS);
const shopWorkingHoursObjectSchema = z
  .object({
    opensAt: shopHhmmSchema,
    closesAt: shopHhmmSchema,
    weeklyOff: shopWeekdaySchema.nullable(),
  })
  .superRefine((value, ctx) => {
    if (!shopHoursAreSameDay(value.opensAt, value.closesAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Closing time must be after opening time.',
        path: ['closesAt'],
      });
    }
  });
const optionalAddressLine = (max: number) =>
  z
    .union([z.string(), z.null()])
    .transform((value) => {
      const trimmed = (value ?? '').trim();
      return trimmed ? trimmed.slice(0, max) : null;
    });

const shopAddressObjectSchema = z.object({
  unit: optionalAddressLine(80),
  street: optionalAddressLine(120),
  area: optionalAddressLine(80),
  pincode: z
    .union([z.string(), z.null()])
    .transform((value) => {
      const trimmed = (value ?? '').trim();
      return trimmed ? trimmed : null;
    })
    .refine((value) => value === null || /^\d{6}$/.test(value), 'PIN must be 6 digits.'),
});

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

export const createCompanySchema = z
  .object({
    name: z.string().trim().min(1, 'Business name is required').max(120),
    city: z.string().trim().min(1, 'City is required').max(80),
    contactPerson: z.string().trim().min(1, 'Contact person is required').max(120),
    /** Master Category slugs (sheet Section A). */
    masterCategories: z.array(z.enum(masterCategorySlugValues)).max(13).optional(),
    /** @deprecated Prefer masterCategories. */
    superCategories: z.array(z.string()).max(5).optional(),
    sellCategories: z.array(z.string().trim().min(1)).max(40).default([]),
    buyCategories: z.array(z.string().trim().min(1)).max(40).default([]),
    about: z.string().trim().max(600).optional(),
    gstNumber: z.string().trim().max(20).optional(),
  })
  .superRefine((value, ctx) => {
    const masters =
      value.masterCategories && value.masterCategories.length > 0
        ? value.masterCategories
        : migrateSuperCategoriesToMaster(value.superCategories ?? []);
    if (masters.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pick at least one category you deal in.',
        path: ['masterCategories'],
      });
    }
  })
  .transform((value) => {
    const masterCategories =
      value.masterCategories && value.masterCategories.length > 0
        ? value.masterCategories
        : migrateSuperCategoriesToMaster(value.superCategories ?? []);
    return { ...value, masterCategories };
  });
export type CreateCompanyDto = z.infer<typeof createCompanySchema>;

/**
 * Profile update. contactPerson updates the acting user's display name (not a
 * company column). canPublish is never set from sellCategories here — it unlocks
 * on first publish consent.
 */
const websiteUrlSchema = z
  .string()
  .trim()
  .max(300)
  .nullable()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const normalized = normalizeWebsiteUrl(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid website.',
      });
      return z.NEVER;
    }
    return normalized;
  });

export const updateCompanySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  contactPerson: z.string().trim().min(1).max(120).optional(),
  masterCategories: z.array(z.enum(masterCategorySlugValues)).min(1).max(13).optional(),
  superCategories: z.array(z.string()).max(5).optional(),
  sellCategories: z.array(z.string().trim().min(1)).max(40).optional(),
  buyCategories: z.array(z.string().trim().min(1)).max(40).optional(),
  about: z.string().trim().max(600).optional().nullable(),
  gstNumber: z.string().trim().max(20).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  showcaseUrls: z.array(z.string().url()).max(BUSINESS_SHOWCASE_MAX).optional(),
  profileVisibility: z.enum(profileVisibilityValues).optional(),
  contactPhone: z.string().trim().max(20).optional().nullable(),
  showContactPhone: z.boolean().optional(),
  workingHours: shopWorkingHoursObjectSchema.nullable().optional(),
  shopAddress: shopAddressObjectSchema.nullable().optional(),
  websiteUrl: websiteUrlSchema,
});
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;

/**
 * Public Business Profile. Phones are not on this DTO — use contact endpoint
 * (Connections + opt-in). Stub responses omit about/cover/showcase.
 */
export interface PublicCompanyProfile {
  id: string;
  name: string;
  city: string;
  about: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  showcaseUrls: string[];
  profileVisibility: string;
  /** False when Private and viewer is not an approved follower (stub). */
  profileAccess: boolean;
  verification: string;
  categories: string[];
  /** @deprecated Prefer masterCategories. */
  superCategories: string[];
  /** Master Category slugs (sheet Section A). */
  masterCategories?: string[];
  /** Viewer has an allowed follow (omit on own profile). */
  following?: boolean;
  /** Viewer asked; not allowed yet. */
  followPending?: boolean;
  /** Viewer may put this shop’s designs in a pack (no look/pack label). */
  canPutInPack?: boolean;
  /** Viewer has an active Connection with this shop. */
  connected?: boolean;
  /** Viewer already has an active 1:1 with this shop (not a pending request). */
  hasChat?: boolean;
  /** ISO timestamp when the company joined Ekum. */
  createdAt?: string;
  /** Same hours every working day; omitted/null on stub and when unset. */
  workingHours?: ShopWorkingHours | null;
  /** Street parts only — city stays `city`. */
  shopAddress?: ShopAddress | null;
  websiteUrl?: string | null;
}

/** A public-safe contact point. Phone is masked unless the business opts in. */
export interface CompanyContactPoint {
  name: string;
  role: string | null;
  phone: string | null;
  /** company = business number; member = team display phone. */
  kind?: 'company' | 'member';
}

/** The owner's full view of their own company. */
export interface OwnCompanyProfile extends PublicCompanyProfile {
  gstNumber: string | null;
  sellCategories: string[];
  buyCategories: string[];
  contactPerson: string | null;
  contactPhone: string | null;
  showContactPhone: boolean;
  capabilities: CompanyCapabilities;
  tradePresence: TradePresence;
  role: string;
  permissions: CompanyPermissions;
}
