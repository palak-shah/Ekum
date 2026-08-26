import { z } from 'zod';
import { membershipRoleValues } from './enums';
import type { CompanyPermissions } from './company';
import type { PublicCompanySummary } from './access';

export const companyPermissionsSchema = z.object({
  uploads: z.boolean(),
  chats: z.boolean(),
  orders: z.boolean(),
  payments: z.boolean(),
  team: z.boolean(),
});
export type CompanyPermissionsDto = z.infer<typeof companyPermissionsSchema>;

export const createTeamInviteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, '').slice(-10))
    .refine((value) => /^\d{10}$/.test(value), 'Enter a 10-digit phone.'),
});
export type CreateTeamInviteDto = z.infer<typeof createTeamInviteSchema>;

export const updateTeamMemberSchema = z.object({
  permissions: companyPermissionsSchema.partial().optional(),
  role: z.enum(membershipRoleValues).optional(),
});
export type UpdateTeamMemberDto = z.infer<typeof updateTeamMemberSchema>;

export interface TeamMemberView {
  userId: string;
  name: string;
  phoneMasked: string;
  role: string;
  permissions: CompanyPermissions;
  contactRole: string | null;
}

export interface TeamInviteView {
  token: string;
  name: string;
  phoneMasked: string;
  company: PublicCompanySummary;
  expired: boolean;
  used: boolean;
}

export interface CreateTeamInviteResult {
  token: string;
  invitePath: string;
}

export interface JoinTeamResult {
  companyId: string;
  tokens: { accessToken: string; refreshToken: string };
}
