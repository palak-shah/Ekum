import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipRole,
  type AuthTokens,
  type CompanyPermissions,
  type CreateTeamInviteDto,
  type CreateTeamInviteResult,
  type TeamInviteView,
  type TeamMemberView,
  type UpdateTeamMemberDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { CompanySerializer } from '../access/company.serializer';
import { randomToken } from '../common/crypto.util';
import { phoneDigits } from '../orders/order-invite-claim';
import { membershipPermissions } from '../auth/require-permission';
import type { AuthPrincipal } from '../auth/auth.types';

const INVITE_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_STAFF_CAPS = {
  canUploads: false,
  canChats: true,
  canOrders: true,
  canPayments: false,
  canTeam: false,
} as const;

function maskPhone(phone: string): string {
  const digits = phoneDigits(phone);
  if (digits.length < 4) return '••••';
  return `••••${digits.slice(-4)}`;
}

function permissionsToRow(permissions: Partial<CompanyPermissions>) {
  return {
    ...(permissions.uploads !== undefined ? { canUploads: permissions.uploads } : {}),
    ...(permissions.chats !== undefined ? { canChats: permissions.chats } : {}),
    ...(permissions.orders !== undefined ? { canOrders: permissions.orders } : {}),
    ...(permissions.payments !== undefined ? { canPayments: permissions.payments } : {}),
    ...(permissions.team !== undefined ? { canTeam: permissions.team } : {}),
  };
}

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly serializer: CompanySerializer,
  ) {}

  async listMembers(companyId: string): Promise<TeamMemberView[]> {
    const rows = await this.prisma.companyMembership.findMany({
      where: { companyId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    return rows.map((row) => ({
      userId: row.userId,
      name: row.user.name ?? row.contactRole ?? 'Team member',
      phoneMasked: maskPhone(row.user.phone),
      role: row.role,
      permissions: membershipPermissions(row),
      contactRole: row.contactRole,
    }));
  }

  async createInvite(
    actor: AuthPrincipal,
    companyId: string,
    dto: CreateTeamInviteDto,
  ): Promise<CreateTeamInviteResult> {
    const phone = phoneDigits(dto.phone);
    const token = randomToken(18);
    await this.prisma.teamInvite.create({
      data: {
        companyId,
        invitedByUserId: actor.userId,
        token,
        name: dto.name.trim(),
        phone,
        expiresAt: new Date(Date.now() + INVITE_MS),
      },
    });
    return { token, invitePath: `/t/${token}` };
  }

  async resolveInvite(token: string): Promise<TeamInviteView> {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { token },
      include: { company: true },
    });
    if (!invite) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'This invite is not valid.' });
    }
    return {
      token,
      name: invite.name,
      phoneMasked: maskPhone(invite.phone),
      company: this.serializer.toPublicSummary(invite.company),
      expired: invite.expiresAt.getTime() < Date.now(),
      used: Boolean(invite.usedAt),
    };
  }

  async joinInvite(actor: AuthPrincipal, token: string): Promise<{ tokens: AuthTokens; companyId: string }> {
    const invite = await this.requireOpenInvite(token);
    if (phoneDigits(actor.phone) !== invite.phone) {
      throw new ForbiddenException({
        code: 'WRONG_PHONE',
        message: 'Sign in with the phone on this invite.',
      });
    }

    const existing = await this.prisma.companyMembership.findFirst({
      where: { userId: actor.userId },
    });
    if (existing) {
      if (existing.companyId === invite.companyId) {
        throw new ConflictException({
          code: 'ALREADY_MEMBER',
          message: 'You are already on this team.',
        });
      }
      throw new ConflictException({
        code: 'ALREADY_HAS_BUSINESS',
        message: 'This phone already has a business on Ekum.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.companyMembership.create({
        data: {
          userId: actor.userId,
          companyId: invite.companyId,
          role: MembershipRole.Staff,
          contactRole: invite.name.trim(),
          ...DEFAULT_STAFF_CAPS,
        },
      });
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { id: actor.userId },
        data: { name: invite.name.trim() },
      });
    });

    const tokens = await this.tokens.issue(
      { id: actor.userId, phone: actor.phone },
      invite.companyId,
    );
    return { tokens, companyId: invite.companyId };
  }

  async updateMember(
    actor: AuthPrincipal,
    companyId: string,
    userId: string,
    dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberView> {
    const target = await this.prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    if (!target) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Team member not found.' });
    }

    if (dto.role === MembershipRole.Staff && target.role === MembershipRole.Owner) {
      await this.assertNotLastOwner(companyId, userId);
    }
    if (target.role === MembershipRole.Owner && actor.role !== MembershipRole.Owner) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'Only the owner can change another owner.',
      });
    }

    const updated = await this.prisma.companyMembership.update({
      where: { userId_companyId: { userId, companyId } },
      data: {
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.permissions ? permissionsToRow(dto.permissions) : {}),
      },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    return {
      userId: updated.userId,
      name: updated.user.name ?? updated.contactRole ?? 'Team member',
      phoneMasked: maskPhone(updated.user.phone),
      role: updated.role,
      permissions: membershipPermissions(updated),
      contactRole: updated.contactRole,
    };
  }

  async removeMember(actor: AuthPrincipal, companyId: string, userId: string): Promise<void> {
    const target = await this.prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!target) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Team member not found.' });
    }
    if (target.role === MembershipRole.Owner) {
      await this.assertNotLastOwner(companyId, userId);
    }
    if (userId === actor.userId) {
      throw new BadRequestException({
        code: 'SELF',
        message: 'You cannot remove yourself here.',
      });
    }
    await this.prisma.companyMembership.delete({
      where: { userId_companyId: { userId, companyId } },
    });
  }

  private async requireOpenInvite(token: string) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { token },
      include: { company: true },
    });
    if (!invite) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'This invite is not valid.' });
    }
    if (invite.usedAt || invite.expiresAt.getTime() < Date.now()) {
      throw new ConflictException({
        code: 'EXPIRED',
        message: 'This invite has expired.',
      });
    }
    return invite;
  }

  private async assertNotLastOwner(companyId: string, userId: string) {
    const owners = await this.prisma.companyMembership.count({
      where: { companyId, role: MembershipRole.Owner },
    });
    const target = await this.prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId, companyId } },
      select: { role: true },
    });
    if (owners <= 1 && target?.role === MembershipRole.Owner) {
      throw new ConflictException({
        code: 'LAST_OWNER',
        message: 'You need at least one owner.',
      });
    }
  }
}
