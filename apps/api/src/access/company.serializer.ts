import { Injectable } from '@nestjs/common';
import type { Company, CompanyMembership, User } from '@prisma/client';
import {
  SHOP_WEEKDAYS,
  type CompanyContactPoint,
  type CompanyPermissions,
  type OwnCompanyProfile,
  type PublicCompanyProfile,
  type PublicCompanySummary,
  type ShopAddress,
  type ShopWeekday,
  type ShopWorkingHours,
  type TradePresence,
} from '@ekum/domain-types';
import { MembershipRole, ProfileVisibility } from '@ekum/domain-types';
import { resolveTradePresence } from '../identity/trade-presence';
import { membershipPermissions } from '../auth/require-permission';

type MembershipWithUser = CompanyMembership & { user: Pick<User, 'name' | 'phone'> };

type CompanyShopFace = Company & {
  opensAt?: string | null;
  closesAt?: string | null;
  weeklyOff?: string | null;
  addressUnit?: string | null;
  addressStreet?: string | null;
  addressArea?: string | null;
  addressPincode?: string | null;
  websiteUrl?: string | null;
};

function asWeekday(value: string | null | undefined): ShopWeekday | null {
  if (!value) return null;
  return (SHOP_WEEKDAYS as readonly string[]).includes(value) ? (value as ShopWeekday) : null;
}

function workingHoursFromCompany(company: CompanyShopFace): ShopWorkingHours | null {
  if (!company.opensAt || !company.closesAt) return null;
  return {
    opensAt: company.opensAt,
    closesAt: company.closesAt,
    weeklyOff: asWeekday(company.weeklyOff),
  };
}

function shopAddressFromCompany(company: CompanyShopFace): ShopAddress | null {
  const unit = company.addressUnit?.trim() || null;
  const street = company.addressStreet?.trim() || null;
  const area = company.addressArea?.trim() || null;
  const pincode = company.addressPincode?.trim() || null;
  if (!unit && !street && !area && !pincode) return null;
  return { unit, street, area, pincode };
}

/**
 * The single serialization boundary for company data. Contact protection is
 * enforced here: the login phone is never emitted, and a contact point's
 * display phone appears only when the business has explicitly opted in.
 */
@Injectable()
export class CompanySerializer {
  toPublicProfile(company: Company, opts?: { profileAccess?: boolean }): PublicCompanyProfile {
    const shop = company as CompanyShopFace;
    const masterCategories =
      'masterCategories' in company && Array.isArray(company.masterCategories)
        ? company.masterCategories
        : [];
    const dealIn =
      masterCategories.length > 0
        ? masterCategories
        : company.superCategories;
    const profileAccess = opts?.profileAccess !== false;
    const profileVisibility =
      company.profileVisibility === ProfileVisibility.Private
        ? ProfileVisibility.Private
        : ProfileVisibility.Public;
    const createdAt =
      company.createdAt instanceof Date
        ? company.createdAt.toISOString()
        : typeof company.createdAt === 'string'
          ? company.createdAt
          : undefined;
    if (!profileAccess) {
      return {
        id: company.id,
        name: company.name,
        city: company.city,
        about: null,
        logoUrl: company.logoUrl,
        coverUrl: null,
        showcaseUrls: [],
        profileVisibility,
        profileAccess: false,
        verification: company.verification,
        categories: [],
        superCategories: [],
        masterCategories: [],
        createdAt,
        workingHours: null,
        shopAddress: null,
        websiteUrl: null,
      };
    }
    return {
      id: company.id,
      name: company.name,
      city: company.city,
      about: company.about,
      logoUrl: company.logoUrl,
      coverUrl: company.coverUrl,
      showcaseUrls: company.showcaseUrls ?? [],
      profileVisibility,
      profileAccess: true,
      verification: company.verification,
      categories: company.sellCategories.length > 0 ? company.sellCategories : dealIn,
      superCategories: company.superCategories,
      masterCategories,
      createdAt,
      workingHours: workingHoursFromCompany(shop),
      shopAddress: shopAddressFromCompany(shop),
      websiteUrl: shop.websiteUrl ?? null,
    };
  }

  toPublicSummary(company: Company): PublicCompanySummary {
    return {
      id: company.id,
      name: company.name,
      city: company.city,
      verification: company.verification,
      logoUrl: company.logoUrl,
      sellCategories: company.sellCategories,
    };
  }

  toOwnProfile(
    company: Company,
    contactPerson: string | null = null,
    tradeDefaults: unknown = null,
    membership: {
      role: string;
      canUploads: boolean;
      canChats: boolean;
      canOrders: boolean;
      canPayments: boolean;
      canTeam: boolean;
    } | null = null,
  ): OwnCompanyProfile {
    const tradePresence: TradePresence = resolveTradePresence(tradeDefaults);
    const permissions: CompanyPermissions = membership
      ? membershipPermissions(membership)
      : {
          uploads: true,
          chats: true,
          orders: true,
          payments: true,
          team: true,
        };
    return {
      ...this.toPublicProfile(company, { profileAccess: true }),
      gstNumber: company.gstNumber,
      sellCategories: company.sellCategories,
      buyCategories: company.buyCategories,
      contactPerson,
      contactPhone: company.contactPhone,
      showContactPhone: company.showContactPhone,
      capabilities: {
        publish: company.canPublish,
        relist: company.canRelist,
        refer: company.canRefer,
      },
      tradePresence,
      role: membership?.role ?? MembershipRole.Owner,
      permissions,
    };
  }

  /**
   * Connections-only. Company number first (if opted in), then team display phones.
   * Login OTP phone is never emitted.
   */
  toContactPoints(
    memberships: MembershipWithUser[],
    company?: Pick<Company, 'name' | 'contactPhone' | 'showContactPhone'>,
  ): CompanyContactPoint[] {
    const points: CompanyContactPoint[] = [];
    if (company?.showContactPhone && company.contactPhone) {
      points.push({
        name: company.name,
        role: 'Business',
        phone: company.contactPhone,
        kind: 'company',
      });
    }
    for (const membership of memberships) {
      if (!membership.contactRole && !membership.showPhone) continue;
      points.push({
        name: membership.user.name ?? 'Team member',
        role: membership.contactRole,
        phone: membership.showPhone ? membership.displayPhone : null,
        kind: 'member',
      });
    }
    return points;
  }
}
