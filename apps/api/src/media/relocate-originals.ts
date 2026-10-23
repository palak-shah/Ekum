import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  blobFileExt,
  isImageFileName,
  parseManagedMediaUrl,
  relocateOriginalBlobPath,
  relocateOriginalUrl,
} from '@ekum/domain-types';
import type { PrismaClient } from '@prisma/client';
import type { StorageDriver } from './storage/storage.types';

const SAMPLE_CAP = 20;
const ROOT_SKIP_DIRS = new Set(['seed']);

export type RelocateSample = { from: string; to: string };
export type RelocateReport = {
  dryRun: boolean;
  copied: number;
  alreadyInPlace: number;
  missingSource: number;
  urlRowsRewritten: number;
  skipped: number;
  samples: RelocateSample[];
};

export function contentTypeForImageFile(fileName: string): string {
  const ext = blobFileExt(fileName).toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export function sha256Hex(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Local `.media` leftover images: `{companyId}/{file}` at the company root.
 * Skips `seed/`, variant folders, audio, and documents.
 */
export async function listLegacyCompanyImageBlobPaths(mediaRoot: string): Promise<string[]> {
  const out: string[] = [];
  let companyDirs: string[];
  try {
    companyDirs = await readdir(mediaRoot);
  } catch {
    return out;
  }
  for (const companyId of companyDirs) {
    if (ROOT_SKIP_DIRS.has(companyId)) continue;
    const companyDir = join(mediaRoot, companyId);
    let entries;
    try {
      entries = await readdir(companyDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!isImageFileName(entry.name)) continue;
      out.push(`${companyId}/${entry.name}`);
    }
  }
  return out;
}

/**
 * Copy source → dest and verify bytes. Does not delete source.
 * Returns `copied` | `already` | `missing-source` | `would-copy`.
 */
export async function copyOriginalVerified(
  storage: StorageDriver,
  fromPath: string,
  toPath: string,
  dryRun: boolean,
): Promise<'copied' | 'already' | 'missing-source' | 'would-copy'> {
  if (fromPath === toPath) return 'already';
  const src = await storage.getObject(fromPath);
  if (!src) return 'missing-source';
  const dest = await storage.getObject(toPath);
  if (dest && dest.length === src.length && sha256Hex(dest) === sha256Hex(src)) {
    return 'already';
  }
  if (dryRun) return 'would-copy';
  await storage.putObject({
    blobPath: toPath,
    body: src,
    contentType: contentTypeForImageFile(toPath.split('/').pop() ?? fromPath),
  });
  const verify = await storage.getObject(toPath);
  if (!verify || verify.length !== src.length || sha256Hex(verify) !== sha256Hex(src)) {
    throw new Error(`Copy verify failed for ${toPath}.`);
  }
  return 'copied';
}

function rewriteUrl(url: string): string {
  return relocateOriginalUrl(url);
}

function rewriteUrlList(urls: string[]): { next: string[]; changed: boolean } {
  const next = urls.map((url) => rewriteUrl(url));
  return { next, changed: next.some((url, i) => url !== urls[i]) };
}

function rewriteJson(value: unknown): unknown {
  if (typeof value === 'string') return rewriteUrl(value);
  if (Array.isArray(value)) return value.map(rewriteJson);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = rewriteJson(nested);
    }
    return out;
  }
  return value;
}

function collectBlobMove(url: string, moves: Map<string, string>): void {
  const managed = parseManagedMediaUrl(url);
  if (!managed) return;
  const dest = relocateOriginalBlobPath(managed.blobPath);
  if (!dest || dest === managed.blobPath) return;
  if (!isImageFileName(managed.blobPath.split('/').pop() ?? '')) return;
  moves.set(managed.blobPath, dest);
}

function collectFromList(urls: string[] | null | undefined, moves: Map<string, string>): void {
  for (const url of urls ?? []) collectBlobMove(url, moves);
}

function pushSample(report: RelocateReport, from: string, to: string): void {
  if (from === to) return;
  if (report.samples.length >= SAMPLE_CAP) return;
  report.samples.push({ from, to });
}

export async function relocateOriginals(input: {
  prisma: PrismaClient;
  storage: StorageDriver;
  apply: boolean;
  /** Local media root: also copy leftover `{companyId}/{file}` images with no DB URL. */
  mediaRoot?: string;
}): Promise<RelocateReport> {
  const dryRun = !input.apply;
  const report: RelocateReport = {
    dryRun,
    copied: 0,
    alreadyInPlace: 0,
    missingSource: 0,
    urlRowsRewritten: 0,
    skipped: 0,
    samples: [],
  };
  const moves = new Map<string, string>();

  const mediaRows = await input.prisma.media.findMany({
    where: { kind: 'image' },
    select: { id: true, blobPath: true, url: true, thumbnailUrl: true },
  });
  for (const row of mediaRows) {
    const dest = relocateOriginalBlobPath(row.blobPath);
    if (dest && dest !== row.blobPath) moves.set(row.blobPath, dest);
    collectBlobMove(row.url, moves);
    if (row.thumbnailUrl) collectBlobMove(row.thumbnailUrl, moves);
  }

  const products = await input.prisma.product.findMany({ select: { id: true, images: true } });
  for (const row of products) collectFromList(row.images, moves);

  const collections = await input.prisma.collection.findMany({
    select: { id: true, coverImage: true },
  });
  for (const row of collections) {
    if (row.coverImage) collectBlobMove(row.coverImage, moves);
  }

  const companies = await input.prisma.company.findMany({ select: { id: true, logoUrl: true } });
  for (const row of companies) {
    if (row.logoUrl) collectBlobMove(row.logoUrl, moves);
  }

  const threads = await input.prisma.thread.findMany({ select: { id: true, imageUrl: true } });
  for (const row of threads) {
    if (row.imageUrl) collectBlobMove(row.imageUrl, moves);
  }

  const orderItems = await input.prisma.orderItem.findMany({
    select: { id: true, image: true, images: true },
  });
  for (const row of orderItems) {
    if (row.image) collectBlobMove(row.image, moves);
    collectFromList(row.images, moves);
  }

  const orders = await input.prisma.order.findMany({
    select: { id: true, manualOrderImages: true },
  });
  for (const row of orders) collectFromList(row.manualOrderImages, moves);

  const notes = await input.prisma.orderCompanyNote.findMany({
    select: { id: true, images: true },
  });
  for (const row of notes) collectFromList(row.images, moves);

  const trail = await input.prisma.orderTrailEvent.findMany({
    select: { id: true, noteImageUrls: true },
  });
  for (const row of trail) collectFromList(row.noteImageUrls, moves);

  const legs = await input.prisma.orderShipmentLeg.findMany({
    select: { id: true, imageUrls: true },
  });
  for (const row of legs) collectFromList(row.imageUrls, moves);

  const complaints = await input.prisma.complaint.findMany({
    select: { id: true, images: true },
  });
  for (const row of complaints) collectFromList(row.images, moves);

  const messages = await input.prisma.message.findMany({
    where: { type: { in: ['photo', 'document'] } },
    select: { id: true, body: true, metadata: true, type: true },
  });
  for (const row of messages) {
    if (row.body) collectBlobMove(row.body, moves);
    walkJsonForUrls(row.metadata, (url) => collectBlobMove(url, moves));
  }

  if (input.mediaRoot) {
    for (const blobPath of await listLegacyCompanyImageBlobPaths(input.mediaRoot)) {
      const dest = relocateOriginalBlobPath(blobPath);
      if (dest && dest !== blobPath) moves.set(blobPath, dest);
    }
  }

  const copiedOk = new Set<string>();
  for (const [fromPath, toPath] of moves) {
    const result = await copyOriginalVerified(input.storage, fromPath, toPath, dryRun);
    if (result === 'copied' || result === 'would-copy') {
      report.copied += 1;
      copiedOk.add(fromPath);
      pushSample(report, fromPath, toPath);
    } else if (result === 'already') {
      report.alreadyInPlace += 1;
      copiedOk.add(fromPath);
    } else {
      report.missingSource += 1;
      report.skipped += 1;
    }
  }

  const destReady = (url: string): boolean => {
    const managed = parseManagedMediaUrl(url);
    if (!managed) return true;
    const dest = relocateOriginalBlobPath(managed.blobPath);
    if (!dest || dest === managed.blobPath) return true;
    return copiedOk.has(managed.blobPath);
  };

  if (dryRun) {
    for (const row of mediaRows) {
      const nextUrl = rewriteUrl(row.url);
      const nextPath = relocateOriginalBlobPath(row.blobPath) ?? row.blobPath;
      if (nextUrl !== row.url) pushSample(report, row.url, nextUrl);
      if (nextPath !== row.blobPath || nextUrl !== row.url) report.urlRowsRewritten += 1;
    }
    for (const row of products) {
      const { changed, next } = rewriteUrlList(row.images);
      if (changed) {
        report.urlRowsRewritten += 1;
        if (next[0] && row.images[0]) pushSample(report, row.images[0], next[0]);
      }
    }
    return report;
  }

  await rewriteDatabase(input.prisma, destReady, report);
  return report;
}

function walkJsonForUrls(value: unknown, visit: (url: string) => void): void {
  if (typeof value === 'string') {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkJsonForUrls(item, visit);
    return;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      walkJsonForUrls(nested, visit);
    }
  }
}

async function rewriteDatabase(
  prisma: PrismaClient,
  destReady: (url: string) => boolean,
  report: RelocateReport,
): Promise<void> {
  const mediaRows = await prisma.media.findMany({
    where: { kind: 'image' },
    select: { id: true, blobPath: true, url: true, thumbnailUrl: true },
  });
  for (const row of mediaRows) {
    if (!destReady(row.url)) continue;
    const blobPath = relocateOriginalBlobPath(row.blobPath) ?? row.blobPath;
    const url = rewriteUrl(row.url);
    const thumbnailUrl = row.thumbnailUrl?.includes('_thumb')
      ? null
      : row.thumbnailUrl
        ? rewriteUrl(row.thumbnailUrl)
        : null;
    if (blobPath === row.blobPath && url === row.url && thumbnailUrl === row.thumbnailUrl) {
      continue;
    }
    await prisma.$transaction(async (tx) => {
      await tx.media.update({
        where: { id: row.id },
        data: { blobPath, url, thumbnailUrl },
      });
    });
    report.urlRowsRewritten += 1;
    pushSample(report, row.url, url);
  }

  const products = await prisma.product.findMany({ select: { id: true, images: true } });
  for (const row of products) {
    if (!row.images.every(destReady)) continue;
    const { next, changed } = rewriteUrlList(row.images);
    if (!changed) continue;
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: row.id }, data: { images: next } });
    });
    report.urlRowsRewritten += 1;
    if (row.images[0] && next[0]) pushSample(report, row.images[0], next[0]);
  }

  const collections = await prisma.collection.findMany({
    select: { id: true, coverImage: true },
  });
  for (const row of collections) {
    if (!row.coverImage || !destReady(row.coverImage)) continue;
    const coverImage = rewriteUrl(row.coverImage);
    if (coverImage === row.coverImage) continue;
    await prisma.$transaction(async (tx) => {
      await tx.collection.update({ where: { id: row.id }, data: { coverImage } });
    });
    report.urlRowsRewritten += 1;
    pushSample(report, row.coverImage, coverImage);
  }

  const companies = await prisma.company.findMany({ select: { id: true, logoUrl: true } });
  for (const row of companies) {
    if (!row.logoUrl || !destReady(row.logoUrl)) continue;
    const logoUrl = rewriteUrl(row.logoUrl);
    if (logoUrl === row.logoUrl) continue;
    await prisma.$transaction(async (tx) => {
      await tx.company.update({ where: { id: row.id }, data: { logoUrl } });
    });
    report.urlRowsRewritten += 1;
    pushSample(report, row.logoUrl, logoUrl);
  }

  const threads = await prisma.thread.findMany({ select: { id: true, imageUrl: true } });
  for (const row of threads) {
    if (!row.imageUrl || !destReady(row.imageUrl)) continue;
    const imageUrl = rewriteUrl(row.imageUrl);
    if (imageUrl === row.imageUrl) continue;
    await prisma.$transaction(async (tx) => {
      await tx.thread.update({ where: { id: row.id }, data: { imageUrl } });
    });
    report.urlRowsRewritten += 1;
    pushSample(report, row.imageUrl, imageUrl);
  }

  const orderItems = await prisma.orderItem.findMany({
    select: { id: true, image: true, images: true },
  });
  for (const row of orderItems) {
    const imageOk = !row.image || destReady(row.image);
    if (!imageOk || !row.images.every(destReady)) continue;
    const image = row.image ? rewriteUrl(row.image) : row.image;
    const { next: images, changed } = rewriteUrlList(row.images);
    if (image === row.image && !changed) continue;
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.update({ where: { id: row.id }, data: { image, images } });
    });
    report.urlRowsRewritten += 1;
  }

  const orders = await prisma.order.findMany({
    select: { id: true, manualOrderImages: true },
  });
  for (const row of orders) {
    if (!row.manualOrderImages.every(destReady)) continue;
    const { next, changed } = rewriteUrlList(row.manualOrderImages);
    if (!changed) continue;
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: row.id }, data: { manualOrderImages: next } });
    });
    report.urlRowsRewritten += 1;
  }

  const notes = await prisma.orderCompanyNote.findMany({
    select: { id: true, images: true },
  });
  for (const row of notes) {
    if (!row.images.every(destReady)) continue;
    const { next, changed } = rewriteUrlList(row.images);
    if (!changed) continue;
    await prisma.$transaction(async (tx) => {
      await tx.orderCompanyNote.update({ where: { id: row.id }, data: { images: next } });
    });
    report.urlRowsRewritten += 1;
  }

  const trail = await prisma.orderTrailEvent.findMany({
    select: { id: true, noteImageUrls: true },
  });
  for (const row of trail) {
    if (!row.noteImageUrls.every(destReady)) continue;
    const { next, changed } = rewriteUrlList(row.noteImageUrls);
    if (!changed) continue;
    await prisma.$transaction(async (tx) => {
      await tx.orderTrailEvent.update({ where: { id: row.id }, data: { noteImageUrls: next } });
    });
    report.urlRowsRewritten += 1;
  }

  const legs = await prisma.orderShipmentLeg.findMany({
    select: { id: true, imageUrls: true },
  });
  for (const row of legs) {
    if (!row.imageUrls.every(destReady)) continue;
    const { next, changed } = rewriteUrlList(row.imageUrls);
    if (!changed) continue;
    await prisma.$transaction(async (tx) => {
      await tx.orderShipmentLeg.update({ where: { id: row.id }, data: { imageUrls: next } });
    });
    report.urlRowsRewritten += 1;
  }

  const complaints = await prisma.complaint.findMany({
    select: { id: true, images: true },
  });
  for (const row of complaints) {
    if (!row.images.every(destReady)) continue;
    const { next, changed } = rewriteUrlList(row.images);
    if (!changed) continue;
    await prisma.$transaction(async (tx) => {
      await tx.complaint.update({ where: { id: row.id }, data: { images: next } });
    });
    report.urlRowsRewritten += 1;
  }

  const messages = await prisma.message.findMany({
    where: { type: { in: ['photo', 'document'] } },
    select: { id: true, body: true, metadata: true },
  });
  for (const row of messages) {
    const body = row.body ? rewriteUrl(row.body) : row.body;
    const metadata = rewriteJson(row.metadata);
    const bodyOk = !row.body || destReady(row.body);
    if (!bodyOk) continue;
    if (body === row.body && JSON.stringify(metadata) === JSON.stringify(row.metadata)) continue;
    await prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: { id: row.id },
        data: { body, metadata: metadata as object },
      });
    });
    report.urlRowsRewritten += 1;
    if (row.body && body) pushSample(report, row.body, body);
  }
}
