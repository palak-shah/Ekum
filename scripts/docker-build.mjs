#!/usr/bin/env node
/**
 * Resolve build meta, `docker compose build`, then tag images with sha-<shortSha>.
 */
import { execFileSync, execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

execFileSync(process.execPath, [join(root, 'scripts/resolve-build-meta.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const envBuild = readFileSync(join(root, '.env.build'), 'utf8');
const meta = Object.fromEntries(
  envBuild
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const composeArgs = ['compose', '--env-file', '.env.build', 'build', ...process.argv.slice(2)];
execFileSync('docker', composeArgs, { cwd: root, stdio: 'inherit', env: process.env });

const imageTag = meta.EKUM_IMAGE_TAG || meta.EKUM_VERSION || '0.1.0';
const shortSha = meta.EKUM_GIT_SHORT_SHA || 'unknown';
const shaTag = `sha-${shortSha}`;

for (const name of ['ekum-api', 'ekum-web']) {
  try {
    execSync(`docker tag ${name}:${imageTag} ${name}:${shaTag}`, {
      cwd: root,
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn(`Could not tag ${name}:${shaTag}:`, err instanceof Error ? err.message : err);
  }
}

console.log(`Tagged ${['ekum-api', 'ekum-web'].map((n) => `${n}:${imageTag} + ${n}:${shaTag}`).join(', ')}`);
