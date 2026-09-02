import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Always prefer `apps/api/.media` (next to the API package.json), not process.cwd().
 * Dev servers are often started from the monorepo root.
 */
export function resolveLocalMediaRoot(fromDir = __dirname): string {
  let dir = fromDir;
  for (let i = 0; i < 8; i++) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
        if (pkg.name === '@ekum/api') {
          return join(dir, '.media');
        }
      } catch {
        // keep walking
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(process.cwd(), '.media');
}
