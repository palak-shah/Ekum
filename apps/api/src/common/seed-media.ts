/**
 * Local seed thumbnails for demo catalog. Avoids picsum.photos (unreliable / 503).
 * Committed photos live in prisma/seed-assets/; seed copies them to
 * apps/api/.media/seed/ and mountLocalMedia serves GET /media/seed/...
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { resolveLocalMediaRoot } from '../media/local-media-root';

export const SEED_IMAGE_NAMES = [
  'banarasi',
  'georgette',
  'cotton',
  'kanjee',
  'chiffon',
  'salwar',
  'linen',
  'organza',
  'wedding',
  'greyfabric',
  'lining',
  'geobase',
  'millot',
] as const;

export type SeedImageName = (typeof SEED_IMAGE_NAMES)[number];

/** Distinct fabric-ish solid colors for the PNG fallback (tests / missing asset). */
const SEED_COLORS: Record<SeedImageName, [number, number, number]> = {
  banarasi: [180, 80, 60],
  georgette: [90, 110, 160],
  cotton: [210, 190, 150],
  kanjee: [140, 50, 90],
  chiffon: [200, 160, 180],
  salwar: [60, 120, 100],
  linen: [190, 170, 120],
  organza: [160, 140, 200],
  wedding: [170, 100, 80],
  greyfabric: [140, 145, 150],
  lining: [220, 200, 190],
  geobase: [100, 90, 140],
  millot: [120, 100, 80],
};

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Solid RGB PNG (no deps). Default 48×64 — enough for object-cover thumbs. */
export function solidColorPng(
  r: number,
  g: number,
  b: number,
  width = 48,
  height = 64,
): Buffer {
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) {
    const o = 1 + x * 3;
    row[o] = r;
    row[o + 1] = g;
    row[o + 2] = b;
  }
  const raw = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y++) {
    row.copy(raw, y * row.length);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Walk up from `fromDir` to the `@ekum/api` package root. */
export function resolveEkumApiRoot(fromDir = __dirname): string | null {
  let dir = fromDir;
  for (let i = 0; i < 8; i++) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
        if (pkg.name === '@ekum/api') {
          return dir;
        }
      } catch {
        // keep walking
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function resolveSeedAssetsDir(fromDir = __dirname): string {
  const apiRoot = resolveEkumApiRoot(fromDir);
  if (apiRoot) {
    return join(apiRoot, 'prisma', 'seed-assets');
  }
  return join(process.cwd(), 'prisma', 'seed-assets');
}

export function seedMediaBaseUrl(
  publicMediaBase = process.env.PUBLIC_MEDIA_BASE_URL ?? 'http://localhost:3000/media',
): string {
  return publicMediaBase.replace(/\/$/, '');
}

export function seedImageUrl(
  name: SeedImageName,
  publicMediaBase?: string,
): string {
  return `${seedMediaBaseUrl(publicMediaBase)}/seed/${name}.jpg`;
}

export async function ensureSeedImages(options?: {
  mediaRoot?: string;
  publicMediaBase?: string;
  assetsDir?: string;
}): Promise<Record<SeedImageName, string>> {
  const mediaRoot = options?.mediaRoot ?? resolveLocalMediaRoot();
  const assetsDir = options?.assetsDir ?? resolveSeedAssetsDir();
  const dir = join(mediaRoot, 'seed');
  await mkdir(dir, { recursive: true });

  const urls = {} as Record<SeedImageName, string>;
  for (const name of SEED_IMAGE_NAMES) {
    const dest = join(dir, `${name}.jpg`);
    const source = join(assetsDir, `${name}.jpg`);
    if (existsSync(source)) {
      await copyFile(source, dest);
    } else {
      const [r, g, b] = SEED_COLORS[name];
      await writeFile(dest, solidColorPng(r, g, b));
    }
    urls[name] = seedImageUrl(name, options?.publicMediaBase);
  }
  return urls;
}

/** Stable fingerprint so tests can assert PNG output without golden files. */
export function solidColorPngSha256(r: number, g: number, b: number): string {
  return createHash('sha256').update(solidColorPng(r, g, b)).digest('hex');
}
