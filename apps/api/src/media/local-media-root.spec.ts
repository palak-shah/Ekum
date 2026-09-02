import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveLocalMediaRoot } from './local-media-root';

describe('resolveLocalMediaRoot', () => {
  it('finds apps/api/.media by walking up to @ekum/api package.json', () => {
    const base = join(tmpdir(), `ekum-media-root-${Date.now()}`);
    const pkgDir = join(base, 'apps', 'api');
    const nested = join(pkgDir, 'dist', 'media');
    mkdirSync(nested, { recursive: true });
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@ekum/api' }),
    );

    expect(resolveLocalMediaRoot(nested)).toBe(join(pkgDir, '.media'));

    rmSync(base, { recursive: true, force: true });
  });

  it('falls back to cwd/.media when no @ekum/api package is found', () => {
    const orphan = join(tmpdir(), `ekum-orphan-${Date.now()}`);
    mkdirSync(orphan, { recursive: true });
    const resolved = resolveLocalMediaRoot(orphan);
    expect(resolved.endsWith('.media')).toBe(true);
    expect(existsSync(join(orphan, 'package.json'))).toBe(false);
    rmSync(orphan, { recursive: true, force: true });
  });
});
