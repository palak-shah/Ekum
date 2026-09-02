import { ConflictException, ForbiddenException } from '@nestjs/common';
import { MembershipRole, countedMemberIds, membershipKey, ThreadMemberState } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';

export async function activeOwnerUserIds(
  prisma: PrismaService,
  companyId: string,
): Promise<string[]> {
  const rows = await prisma.companyMembership.findMany({
    where: { companyId, role: MembershipRole.Owner, archivedAt: null },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}

export async function assertSameCompanyUsers(
  prisma: PrismaService,
  companyId: string,
  userIds: string[],
): Promise<string[]> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return [];
  const rows = await prisma.companyMembership.findMany({
    where: { companyId, userId: { in: unique }, archivedAt: null },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}

export async function ensureMembers(
  prisma: PrismaService,
  threadId: string,
  companyId: string,
  userIds: string[],
): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await prisma.threadMember.createMany({
    data: unique.map((userId) => ({
      threadId,
      userId,
      companyId,
      state: ThreadMemberState.Active,
    })),
    skipDuplicates: true,
  });
  await prisma.threadMember.updateMany({
    where: { threadId, userId: { in: unique } },
    data: { state: ThreadMemberState.Active, leftAt: null },
  });
}

export async function seedOwnersAndStaff(
  prisma: PrismaService,
  threadId: string,
  companyId: string,
  extraUserIds: string[] = [],
): Promise<void> {
  const owners = await activeOwnerUserIds(prisma, companyId);
  const extra = await assertSameCompanyUsers(prisma, companyId, extraUserIds);
  await ensureMembers(prisma, threadId, companyId, [...owners, ...extra]);
}

export function sameChatConflict(threadId: string, title: string | null): ConflictException {
  const name = title?.trim() || 'that chat';
  return new ConflictException({
    code: 'SAME_CHAT',
    message: `That’s the same as ${name}. Open that chat?`,
    details: { threadId, title },
  });
}

export function ownerOnlyRoster(): ForbiddenException {
  return new ForbiddenException({
    code: 'NOT_ALLOWED',
    message: 'Only an owner can add or take people off this chat.',
  });
}

export function lastOwnerMute(): ConflictException {
  return new ConflictException({
    code: 'LAST_OWNER',
    message: 'Mute this chat instead of leaving. You are the last owner here.',
  });
}

export async function countedPeopleForCompany(
  prisma: PrismaService,
  threadId: string,
  companyId: string,
): Promise<string[]> {
  const rows = await prisma.threadMember.findMany({
    where: { threadId, companyId },
    select: { userId: true, state: true },
  });
  return countedMemberIds(rows);
}

export function peopleFingerprint(userIds: string[]): string {
  return membershipKey(userIds);
}
