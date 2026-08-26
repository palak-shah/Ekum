import type { CompanyPermissions, OwnCompanyProfile } from '@ekum/domain-types';
import { useMyCompany } from '@/lib/queries';

export type TeamCap = keyof CompanyPermissions;

const ALL_TRUE: CompanyPermissions = {
  uploads: true,
  chats: true,
  orders: true,
  payments: true,
  team: true,
};

export function canTeamCap(
  company: OwnCompanyProfile | undefined | null,
  cap: TeamCap,
): boolean {
  return company?.permissions?.[cap] ?? true;
}

export function useTeamCaps() {
  const company = useMyCompany();
  const permissions = company.data?.permissions ?? ALL_TRUE;
  const role = company.data?.role ?? 'owner';
  return {
    ...company,
    role,
    permissions,
    can: (cap: TeamCap) => permissions[cap],
    isOwner: role === 'owner',
  };
}
