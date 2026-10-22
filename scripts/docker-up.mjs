#!/usr/bin/env node
/**
 * Resolve build meta, build+tag images, then `docker compose up`.
 * EKUM_DEPLOYMENT=production requires release evidence for HEAD.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  headSha,
  maybeAssertProduction,
  readDeployment,
  readEvidence,
} from './release-gate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const deployment = readDeployment();
const gitSha = headSha(root);
try {
  const result = maybeAssertProduction({
    deployment,
    gitSha,
    evidence: readEvidence(gitSha, root),
  });
  if (!result.skipped) {
    process.stdout.write(`Release gate ${result.decision} for ${gitSha.slice(0, 7)}.\n`);
  }
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
}

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
