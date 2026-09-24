import { z } from 'zod';

export const MESSAGE_MENTION_MAX = 8;

export const messageMentionSchema = z.object({
  kind: z.enum(['user', 'company']),
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(80),
});
export type MessageMention = z.infer<typeof messageMentionSchema>;

export const messageMentionsSchema = z.array(messageMentionSchema).max(MESSAGE_MENTION_MAX);

export function mentionsFromMetadata(metadata: unknown): MessageMention[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const raw = (metadata as { mentions?: unknown }).mentions;
  const parsed = messageMentionsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export function withMentionsMetadata(
  metadata: Record<string, unknown> | undefined,
  mentions: MessageMention[],
): Record<string, unknown> | undefined {
  const next = { ...(metadata ?? {}) };
  if (mentions.length === 0) {
    delete next.mentions;
    return Object.keys(next).length ? next : undefined;
  }
  next.mentions = mentions.slice(0, MESSAGE_MENTION_MAX);
  return next;
}

export function mentionsStillInBody(body: string, mentions: MessageMention[]): MessageMention[] {
  return mentions.filter((row) => body.includes(`@${row.name}`));
}

/** `@` at the start of a word (not email). */
export function activeMentionQuery(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const safeCaret = Math.max(0, Math.min(caret, text.length));
  const head = text.slice(0, safeCaret);
  const match = /(?:^|[\s])@([^\s@]*)$/.exec(head);
  if (!match) return null;
  return { start: head.lastIndexOf('@'), query: match[1] ?? '' };
}

export function insertMentionAt(
  text: string,
  caret: number,
  start: number,
  name: string,
): { text: string; caret: number } {
  const inserted = `@${name} `;
  const next = `${text.slice(0, start)}${inserted}${text.slice(caret)}`;
  return { text: next, caret: start + inserted.length };
}

export type MentionCandidate = {
  kind: 'user' | 'company';
  id: string;
  name: string;
  hint: string;
};

export function mentionCandidates(input: {
  people: Array<{ userId: string; name: string }>;
  shops: Array<{ companyId: string; name: string }>;
  viewerUserId?: string | null;
  query: string;
}): MentionCandidate[] {
  const needle = input.query.trim().toLowerCase();
  const people: MentionCandidate[] = input.people
    .filter((row) => row.userId !== input.viewerUserId)
    .map((row) => ({
      kind: 'user' as const,
      id: row.userId,
      name: row.name.trim() || 'Team',
      hint: 'On this chat',
    }));
  const shops: MentionCandidate[] = input.shops.map((row) => ({
    kind: 'company' as const,
    id: row.companyId,
    name: row.name.trim() || 'Shop',
      hint: '',
  }));
  const all = [...people, ...shops];
  const filtered = needle
    ? all.filter((row) => row.name.toLowerCase().includes(needle))
    : all;
  const seen = new Set<string>();
  const out: MentionCandidate[] = [];
  for (const row of filtered) {
    const key = `${row.kind}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= MESSAGE_MENTION_MAX) break;
  }
  return out;
}
