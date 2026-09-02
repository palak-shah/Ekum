import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ensureSeedImages,
  seedImageUrl,
  solidColorPng,
  solidColorPngSha256,
} from './seed-media';

describe('seedMedia', () => {
  it('builds local media URLs under /seed as jpg', () => {
    expect(seedImageUrl('greyfabric', 'http://localhost:3000/media')).toBe(
      'http://localhost:3000/media/seed/greyfabric.jpg',
    );
  });

  it('writes a valid PNG signature', () => {
    const png = solidColorPng(120, 100, 80);
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(solidColorPngSha256(120, 100, 80)).toHaveLength(64);
  });

  it('ensureSeedImages falls back to solid PNG when an asset is missing', async () => {
    const mediaRoot = await mkdtemp(join(tmpdir(), 'ekum-seed-media-'));
    const assetsDir = await mkdtemp(join(tmpdir(), 'ekum-seed-assets-empty-'));
    const urls = await ensureSeedImages({
      mediaRoot,
      assetsDir,
      publicMediaBase: 'http://127.0.0.1:3000/media',
    });
    expect(urls.millot).toBe('http://127.0.0.1:3000/media/seed/millot.jpg');
    expect(urls.greyfabric).toContain('/seed/greyfabric.jpg');
    const bytes = await readFile(join(mediaRoot, 'seed', 'millot.jpg'));
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });

  it('ensureSeedImages copies committed jpg assets', async () => {
    const mediaRoot = await mkdtemp(join(tmpdir(), 'ekum-seed-media-'));
    const assetsDir = await mkdtemp(join(tmpdir(), 'ekum-seed-assets-'));
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    await mkdir(assetsDir, { recursive: true });
    await writeFile(join(assetsDir, 'millot.jpg'), jpeg);
    const urls = await ensureSeedImages({
      mediaRoot,
      assetsDir,
      publicMediaBase: 'http://127.0.0.1:3000/media',
    });
    expect(urls.millot).toBe('http://127.0.0.1:3000/media/seed/millot.jpg');
    const copied = await readFile(join(mediaRoot, 'seed', 'millot.jpg'));
    expect(copied.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
  });
});
