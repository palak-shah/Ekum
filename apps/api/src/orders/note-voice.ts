import { BadRequestException } from '@nestjs/common';
import { MediaKind } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';

export type NoteVoiceDto = {
  noteVoiceMediaId?: string;
  noteVoiceDurationMs?: number;
};

export type ReasonVoiceDto = {
  reasonVoiceMediaId?: string;
  reasonVoiceDurationMs?: number;
};

export type ResolvedNoteVoice = {
  mediaId: string;
  url: string;
  durationMs: number;
};

/** Resolve company-owned audio for an optional note/reason voice clip. */
export async function resolveOwnedNoteVoice(
  prisma: PrismaService,
  companyId: string,
  dto: { mediaId?: string; durationMs?: number },
): Promise<ResolvedNoteVoice | null> {
  if (!dto.mediaId) return null;
  if (!dto.durationMs) {
    throw new BadRequestException({
      code: 'VOICE_DURATION_REQUIRED',
      message: 'Voice note needs a duration.',
    });
  }
  const media = await prisma.media.findFirst({
    where: {
      id: dto.mediaId,
      companyId,
      kind: MediaKind.Audio,
    },
  });
  if (!media) {
    throw new BadRequestException({
      code: 'VOICE_NOT_FOUND',
      message: 'Voice note not found. Record again.',
    });
  }
  return {
    mediaId: media.id,
    url: media.url,
    durationMs: dto.durationMs,
  };
}

export async function resolveNoteVoiceFields(
  prisma: PrismaService,
  companyId: string,
  dto: NoteVoiceDto,
): Promise<{
  noteVoiceMediaId: string | null;
  noteVoiceUrl: string | null;
  noteVoiceDurationMs: number | null;
  meta: Record<string, unknown>;
}> {
  const voice = await resolveOwnedNoteVoice(prisma, companyId, {
    mediaId: dto.noteVoiceMediaId,
    durationMs: dto.noteVoiceDurationMs,
  });
  if (!voice) {
    return {
      noteVoiceMediaId: null,
      noteVoiceUrl: null,
      noteVoiceDurationMs: null,
      meta: {},
    };
  }
  return {
    noteVoiceMediaId: voice.mediaId,
    noteVoiceUrl: voice.url,
    noteVoiceDurationMs: voice.durationMs,
    meta: {
      noteVoiceMediaId: voice.mediaId,
      noteVoiceUrl: voice.url,
      noteVoiceDurationMs: voice.durationMs,
    },
  };
}

export async function resolveReasonVoiceFields(
  prisma: PrismaService,
  companyId: string,
  dto: ReasonVoiceDto,
): Promise<{
  reasonVoiceMediaId: string | null;
  reasonVoiceUrl: string | null;
  reasonVoiceDurationMs: number | null;
}> {
  const voice = await resolveOwnedNoteVoice(prisma, companyId, {
    mediaId: dto.reasonVoiceMediaId,
    durationMs: dto.reasonVoiceDurationMs,
  });
  if (!voice) {
    return {
      reasonVoiceMediaId: null,
      reasonVoiceUrl: null,
      reasonVoiceDurationMs: null,
    };
  }
  return {
    reasonVoiceMediaId: voice.mediaId,
    reasonVoiceUrl: voice.url,
    reasonVoiceDurationMs: voice.durationMs,
  };
}
