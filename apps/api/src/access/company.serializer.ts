import { Injectable } from '@nestjs/common';
import type { Company, CompanyMembership, User } from '@prisma/client';
import type {
  CompanyContactPoint,
  OwnCompanyProfile,
  PublicCompanyProfile,
  PublicCompanySummary,
  TradePresence,
} from '@ekum/domain-types';
import { resolveTradePresence } from '../identity/trade-presence';

type MembershipWithUser = CompanyMembership & { user: Pick<User, 'name' | 'phone'> };

/**
 * The single serialization boundary for company data. Contact protection is
 * enforced here: the login phone is never emitted, and a contact point's
 * display phone appears only when the business has explicitly opted in.
 */
@Injectable()
export class CompanySerializer {
  toPublicProfile(company: Company): PublicCompanyProfile {
    return {
      id: company.id,
      name: company.name,
      city: company.city,
      about: company.about,
      logoUrl: company.logoUrl,
      verification: company.verification,
      categories: company.sellCategories.length > 0 ? company.sellCategories : company.superCategories,
      superCategories: company.superCategories,
    };
  }

  toPublicSummary(company: Company): PublicCompanySummary {
    return {
      id: company.id,
      name: company.name,
      city: company.city,
      verification: company.verification,
      logoUrl: company.logoUrl,
    };
  }

  toOwnProfile(
    company: Company,
    contactPerson: string | null = null,
    tradeDefaults: unknown = null,
  ): OwnCompanyProfile {
    const tradePresence: TradePresence = resolveTradePresence(tradeDefaults);
    return {
      ...this.toPublicProfile(company),
      gstNumber: company.gstNumber,
      sellCategories: company.sellCategories,
      buyCategories: company.buyCategories,
      contactPerson,
      capabilities: {
        publish: company.canPublish,
        relist: company.canRelist,
        refer: company.canRefer,
      },
      tradePresence,
    };
  }

  toContactPoints(memberships: MembershipWithUser[]): CompanyContactPoint[] {
    return memberships
      .filter((membership) => membership.contactRole)
      .map((membership) => ({
        name: membership.user.name ?? 'Team member',
        role: membership.contactRole,
        phone: membership.showPhone ? membership.displayPhone : null,
      }));
  }
}
