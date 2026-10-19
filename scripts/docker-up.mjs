#!/usr/bin/env node
/**
 * Resolve build meta, build+tag images, then `docker compose up`.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

execFileSync(process.execPath, [join(root, 'scripts/docker-build.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

execFileSync(
  'docker',
  ['compose', '--env-file', '.env.build', 'up', '-d', '--remove-orphans', ...process.argv.slice(2)],
  { cwd: root, stdio: 'inherit', env: process.env },
);

try {
  execFileSync('docker', ['system', 'prune', '-f'], { cwd: root, stdio: 'inherit' });
} catch {
  // prune is best-effort
}
