import { Injectable } from '@nestjs/common';
import type { Company, Message, Thread, ThreadParticipant } from '@prisma/client';
import {
  ThreadType,
  type AuditActorView,
  type MessageReference,
  type MessageReplyPreview,
  type MessageView,
  type ParticipantView,
  type ThreadDetail,
  type ThreadSummary,
} from '@ekum/domain-types';
import { CompanySerializer } from '../access/company.serializer';

type ParticipantWithCompany = ThreadParticipant & { company: Company };

export interface ThreadSummaryInput {
  thread: Thread;
  participants: ParticipantWithCompany[];
  // Only scalar fields are read for the summary, so the company relation is not required.
  mine: ThreadParticipant;
  unreadCount: number;
  lastMessage: MessageView | null;
  searchHitPreview?: string | null;
  searchHitMessageId?: string | null;
  people?: ThreadDetail['people'];
  canLeave?: boolean;
  canRemoveGroup?: boolean;
  canManagePeople?: boolean;
  alertLevel?: string;
}

@Injectable()
export class ConversationSerializer {
  constructor(private readonly companySerializer: CompanySerializer) {}

  toMessageView(
    message: Message,
    viewerCompanyId: string,
    viewerUserId: string | null,
    reference: MessageReference | null,
    replyTo: MessageReplyPreview | null = null,
  ): MessageView {
    const mine = message.senderCompanyId === viewerCompanyId;
    let actor: AuditActorView | null = null;
    if (
      mine &&
      message.senderUserId &&
      viewerUserId &&
      message.senderUserId !== viewerUserId &&
      message.senderName?.trim()
    ) {
      actor = { id: message.senderUserId, name: message.senderName.trim() };
    }
    return {
      id: message.id,
      threadId: message.threadId,
      senderCompanyId: message.senderCompanyId,
      type: message.type,
      body: message.body,
      reference,
      metadata: message.metadata ?? null,
      createdAt: message.createdAt.toISOString(),
      mine,
      actor,
      replyTo,
    };
  }

  toParticipantView(participant: ParticipantWithCompany): ParticipantView {
    return {
      companyId: participant.companyId,
      company: this.companySerializer.toPublicSummary(participant.company),
      state: participant.state,
      alertLevel: participant.alertLevel,
      lastReadAt: participant.lastReadAt ? participant.lastReadAt.toISOString() : null,
    };
  }

  toThreadSummary(input: ThreadSummaryInput): ThreadSummary {
    const { thread, participants, mine, unreadCount, lastMessage } = input;
    const counterpartParticipant =
      thread.type === ThreadType.Direct
        ? participants.find((participant) => participant.companyId !== mine.companyId)
        : undefined;

    return {
      id: thread.id,
      type: thread.type,
      visibility: thread.visibility,
      title: thread.title,
      state: mine.state,
      alertLevel: input.alertLevel ?? mine.alertLevel,
      pinned: Boolean(mine.pinnedAt),
      unreadCount,
      lastMessage,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      counterpart: counterpartParticipant
        ? this.companySerializer.toPublicSummary(counterpartParticipant.company)
        : null,
      participantCount: participants.length,
      searchHitPreview: input.searchHitPreview ?? null,
      searchHitMessageId: input.searchHitMessageId ?? null,
    };
  }

  toThreadDetail(input: ThreadSummaryInput): ThreadDetail {
    return {
      ...this.toThreadSummary(input),
      participants: input.participants.map((participant) => this.toParticipantView(participant)),
      people: input.people ?? [],
      canLeave: input.canLeave ?? false,
      canRemoveGroup: input.canRemoveGroup ?? false,
      canManagePeople: input.canManagePeople ?? false,
    };
  }
}
