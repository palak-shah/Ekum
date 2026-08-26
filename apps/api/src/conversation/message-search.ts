import { MessageType, orderChatEventLabel } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

const CATALOG_NAME_LIMIT = 200;
const ORDER_LABEL_ID_LIMIT = 500;
const DEEP_HIT_MESSAGE_LIMIT = 500;
const SNIPPET_MAX = 40;

function asMeta(metadata: unknown): Record<string, unknown> | null {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : null;
}

function trimSnippet(text: string, max = SNIPPET_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

/**
 * Quiet why-line for inbox deep search (Chats list second line).
 * Order / Shared / text snippet — never bury the match.
 */
export function formatSearchHitPreview(input: {
  type: string;
  body: string | null;
  metadata: unknown;
  catalogName?: string | null;
}): string {
  const meta = asMeta(input.metadata);
  const orderLabel =
    typeof meta?.orderLabel === 'string' && meta.orderLabel.trim() ? meta.orderLabel.trim() : null;
  if (orderLabel) {
    const event = typeof meta?.event === 'string' ? meta.event : null;
    const eventLabel = event ? orderChatEventLabel(event) : null;
    const short =
      eventLabel &&
      eventLabel.length <= 16 &&
      !orderLabel.toLowerCase().includes(eventLabel.toLowerCase())
        ? eventLabel
        : null;
    return short ? `In chat · ${orderLabel} · ${short}` : `In chat · ${orderLabel}`;
  }

  if (input.type === MessageType.ProductCard || input.type === MessageType.CollectionCard) {
    const name = input.catalogName?.trim();
    return name ? `In chat · Shared: ${name}` : 'In chat · Shared a card';
  }

  const body = input.body?.trim();
  if (body) {
    return `In chat · ${trimSnippet(body)}`;
  }
  return 'In chat · Match';
}

export type ThreadSearchHit = {
  messageId: string;
  preview: string;
};

/**
 * Prisma OR for in-thread / inbox message `q` (case-insensitive body, orderLabel, catalog names).
 */
export async function messageSearchOrClause(
  prisma: PrismaService,
  q: string,
  options?: { threadId?: string },
): Promise<Prisma.MessageWhereInput | null> {
  const needle = q.trim();
  if (!needle) return null;
  const lowered = needle.toLowerCase();
  const like = `%${lowered}%`;

  const orderLabelRows = options?.threadId
    ? await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Message"
        WHERE "threadId" = ${options.threadId}
          AND LOWER(COALESCE(metadata->>'orderLabel', '')) LIKE ${like}
        LIMIT ${ORDER_LABEL_ID_LIMIT}
      `
    : await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Message"
        WHERE LOWER(COALESCE(metadata->>'orderLabel', '')) LIKE ${like}
        LIMIT ${ORDER_LABEL_ID_LIMIT}
      `;

  const [products, collections] = await Promise.all([
    prisma.product.findMany({
      where: { name: { contains: needle, mode: 'insensitive' } },
      select: { id: true },
      take: CATALOG_NAME_LIMIT,
    }),
    prisma.collection.findMany({
      where: { name: { contains: needle, mode: 'insensitive' } },
      select: { id: true },
      take: CATALOG_NAME_LIMIT,
    }),
  ]);

  const or: Prisma.MessageWhereInput[] = [{ body: { contains: needle, mode: 'insensitive' } }];
  if (orderLabelRows.length > 0) {
    or.push({ id: { in: orderLabelRows.map((row) => row.id) } });
  }
  if (products.length > 0) {
    or.push({
      type: MessageType.ProductCard,
      referenceId: { in: products.map((row) => row.id) },
    });
  }
  if (collections.length > 0) {
    or.push({
      type: MessageType.CollectionCard,
      referenceId: { in: collections.map((row) => row.id) },
    });
  }

  return { OR: or };
}

/**
 * Newest matching message per thread the viewer belongs to (for inbox why-lines).
 */
export async function findThreadSearchHits(
  prisma: PrismaService,
  actorCompanyId: string,
  q: string,
): Promise<Map<string, ThreadSearchHit>> {
  const searchOr = await messageSearchOrClause(prisma, q);
  if (!searchOr) return new Map();

  const messages = await prisma.message.findMany({
    where: {
      AND: [
        searchOr,
        {
          thread: {
            participants: {
              some: {
                companyId: actorCompanyId,
                leftAt: null,
              },
            },
          },
        },
      ],
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: DEEP_HIT_MESSAGE_LIMIT,
    select: {
      id: true,
      threadId: true,
      type: true,
      body: true,
      referenceId: true,
      metadata: true,
    },
  });

  const productIds = [
    ...new Set(
      messages
        .filter((m) => m.type === MessageType.ProductCard && m.referenceId)
        .map((m) => m.referenceId as string),
    ),
  ];
  const collectionIds = [
    ...new Set(
      messages
        .filter((m) => m.type === MessageType.CollectionCard && m.referenceId)
        .map((m) => m.referenceId as string),
    ),
  ];

  const [products, collections] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    collectionIds.length
      ? prisma.collection.findMany({
          where: { id: { in: collectionIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);
  const productName = new Map(products.map((row) => [row.id, row.name]));
  const collectionName = new Map(collections.map((row) => [row.id, row.name]));

  const hits = new Map<string, ThreadSearchHit>();
  for (const message of messages) {
    if (hits.has(message.threadId)) continue;
    const catalogName =
      message.type === MessageType.ProductCard && message.referenceId
        ? (productName.get(message.referenceId) ?? null)
        : message.type === MessageType.CollectionCard && message.referenceId
          ? (collectionName.get(message.referenceId) ?? null)
          : null;
    hits.set(message.threadId, {
      messageId: message.id,
      preview: formatSearchHitPreview({
        type: message.type,
        body: message.body,
        metadata: message.metadata,
        catalogName,
      }),
    });
  }
  return hits;
}

/** Title / counterpart name / city match (case-insensitive). */
export function threadSurfaceMatchesQ(input: {
  title: string | null;
  counterpartName: string | null | undefined;
  counterpartCity: string | null | undefined;
  q: string;
}): boolean {
  const needle = input.q.trim().toLowerCase();
  if (!needle) return false;
  const hay = [input.title, input.counterpartName, input.counterpartCity]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}
