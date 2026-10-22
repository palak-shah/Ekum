#!/usr/bin/env node
/**
 * Production release evidence + docker-up lock.
 * EKUM_DEPLOYMENT=test is never gated. No silent skip env.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const REQUIRED_AUTOMATED = [
  'lint',
  'typecheck',
  'unit',
  'build',
  'smokePreview',
  'smokeDocker',
  'releaseJourneys',
];

export const REQUIRED_DEVICES = [
  { platform: 'android', mode: 'chrome' },
  { platform: 'android', mode: 'pwa' },
  { platform: 'iphone', mode: 'safari' },
  { platform: 'iphone', mode: 'pwa' },
];

const AUTOMATED_STEPS = [
  { key: 'lint', args: ['lint'] },
  { key: 'typecheck', args: ['typecheck'] },
  { key: 'unit', args: ['test'] },
  { key: 'build', args: ['build'] },
  { key: 'smokePreview', args: ['test:e2e:smoke:preview'] },
  { key: 'smokeDocker', args: ['test:e2e:smoke:docker'] },
  { key: 'releaseJourneys', args: ['test:e2e:release'] },
];

export function releasesDir(root = DEFAULT_ROOT) {
  return join(root, 'docs', 'superpowers', 'qa', 'releases');
}

export function evidencePath(gitSha, root = DEFAULT_ROOT) {
  return join(releasesDir(root), `${gitSha}.json`);
}

export function headSha(cwd = DEFAULT_ROOT) {
  return execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim();
}

export function readVersionFile(root = DEFAULT_ROOT) {
  try {
    return readFileSync(join(root, 'VERSION'), 'utf8').trim();
  } catch {
    return '0.0.0-dev';
  }
}

/** Same flavour as scripts/resolve-build-meta.mjs */
export function readDeployment({ env = process.env, dockerEnvText } = {}) {
  const fromEnv = env.EKUM_DEPLOYMENT?.trim();
  if (fromEnv) return fromEnv === 'production' ? 'production' : 'test';
  const text = dockerEnvText ?? readDockerEnvText(env);
  if (text) {
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const i = trimmed.indexOf('=');
      if (i <= 0) continue;
      if (trimmed.slice(0, i).trim() === 'EKUM_DEPLOYMENT') {
        return trimmed.slice(i + 1).trim() === 'production' ? 'production' : 'test';
      }
    }
  }
  return 'test';
}

function readDockerEnvText(env, root = DEFAULT_ROOT) {
  try {
    return readFileSync(join(root, '.env.docker'), 'utf8');
  } catch {
    return env.EKUM_DOCKER_ENV_TEXT ?? '';
  }
}

export function productionGateRequired(deployment) {
  return deployment === 'production';
}

export function emptyEvidence({ version, gitSha }) {
  return {
    version,
    gitSha,
    decision: 'AWAITING_DEVICE',
    automated: Object.fromEntries(REQUIRED_AUTOMATED.map((key) => [key, 'not-run'])),
    playwright: {
      chromiumMobile: true,
      webkitMobile: true,
      viewports: ['390x844', '412x915'],
    },
    devices: REQUIRED_DEVICES.map((row) => ({
      ...row,
      os: '',
      date: '',
      tester: '',
      result: 'not-run',
      notes: '',
    })),
    defects: [],
    exception: { reason: '', recordedBy: '', followUp: '' },
  };
}

export function readEvidence(gitSha, root = DEFAULT_ROOT) {
  const path = evidencePath(gitSha, root);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeEvidence(evidence, root = DEFAULT_ROOT) {
  const dir = releasesDir(root);
  mkdirSync(dir, { recursive: true });
  writeFileSync(evidencePath(evidence.gitSha, root), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return evidencePath(evidence.gitSha, root);
}

export function automatedAllPass(evidence) {
  return REQUIRED_AUTOMATED.every((key) => evidence.automated?.[key] === 'pass');
}

export function deviceKey(row) {
  return `${row.platform}:${row.mode}`;
}

export function devicesAllPass(evidence) {
  const byKey = new Map((evidence.devices ?? []).map((row) => [deviceKey(row), row]));
  return REQUIRED_DEVICES.every((need) => byKey.get(deviceKey(need))?.result === 'pass');
}

export function exceptionComplete(evidence) {
  const ex = evidence.exception ?? {};
  return Boolean(ex.reason?.trim() && ex.followUp?.trim() && ex.recordedBy?.trim());
}

export function computeDecision(evidence) {
  if (!automatedAllPass(evidence)) return 'BLOCKED';
  if (devicesAllPass(evidence)) return 'PASS';
  if (exceptionComplete(evidence)) return 'EXCEPTION_APPROVED';
  return 'AWAITING_DEVICE';
}

export function applySignoff(
  evidence,
  { platform, mode, result, tester = '', os = '', notes = '', date = new Date().toISOString().slice(0, 10) },
) {
  const allowed = REQUIRED_DEVICES.some((row) => row.platform === platform && row.mode === mode);
  if (!allowed) {
    throw new Error(`Unknown device ${platform}/${mode}. Use android|iphone and chrome|safari|pwa.`);
  }
  if (!['pass', 'fail', 'not-run'].includes(result)) {
    throw new Error(`result must be pass, fail, or not-run (got ${result})`);
  }
  const devices = (evidence.devices ?? []).map((row) =>
    row.platform === platform && row.mode === mode
      ? { ...row, result, tester, os, notes, date }
      : row,
  );
  if (!devices.some((row) => row.platform === platform && row.mode === mode)) {
    devices.push({ platform, mode, result, tester, os, notes, date });
  }
  const next = { ...evidence, devices };
  next.decision = computeDecision(next);
  return next;
}

export function applyException(evidence, { reason, followUp, recordedBy }) {
  if (!automatedAllPass(evidence)) {
    throw new Error('EXCEPTION_APPROVED requires all automated checks to pass. A red suite cannot be excepted.');
  }
  if (!reason?.trim() || !followUp?.trim() || !recordedBy?.trim()) {
    throw new Error('EXCEPTION_APPROVED needs --reason, --follow-up, and recordedBy.');
  }
  const next = {
    ...evidence,
    exception: { reason: reason.trim(), followUp: followUp.trim(), recordedBy: recordedBy.trim() },
  };
  next.decision = computeDecision(next);
  return next;
}

export function assertProductionReady({ gitSha, evidence, evidenceDirNote } = {}) {
  if (!evidence) {
    throw new Error(
      `Production docker:up blocked: no evidence for ${gitSha}. Run pnpm release:check then device sign-off. ${evidenceDirNote ?? ''}`.trim(),
    );
  }
  if (evidence.gitSha !== gitSha) {
    throw new Error(
      `Production docker:up blocked: evidence SHA ${evidence.gitSha} does not match HEAD ${gitSha}.`,
    );
  }
  const decision = computeDecision(evidence);
  if (decision === 'PASS' || decision === 'EXCEPTION_APPROVED') {
    if (decision === 'EXCEPTION_APPROVED' && !exceptionComplete(evidence)) {
      throw new Error('Production docker:up blocked: EXCEPTION_APPROVED is missing reason / follow-up / recordedBy.');
    }
    return decision;
  }
  if (decision === 'AWAITING_DEVICE') {
    throw new Error(
      `Production docker:up blocked: AWAITING_DEVICE for ${gitSha}. Record Android Chrome+PWA and iPhone Safari+PWA (pnpm release:signoff). Viewport smoke is not a phone.`,
    );
  }
  throw new Error(
    `Production docker:up blocked: ${decision} for ${gitSha}. Fix automated checks; do not skip a red suite.`,
  );
}

export function maybeAssertProduction({ deployment, gitSha, evidence }) {
  if (!productionGateRequired(deployment)) return { skipped: true, decision: null };
  const decision = assertProductionReady({ gitSha, evidence });
  return { skipped: false, decision };
}

export function formatReport(evidence) {
  const auto = REQUIRED_AUTOMATED.map((key) => `${key}: ${evidence.automated?.[key] ?? 'not-run'}`).join('\n');
  const devices = (evidence.devices ?? [])
    .map((row) => `${row.platform} ${row.mode}: ${row.result}${row.os ? ` (${row.os})` : ''}`)
    .join('\n');
  return [
    `# Release ${evidence.version} ${evidence.gitSha.slice(0, 7)}`,
    '',
    `Decision: **${evidence.decision}**`,
    '',
    '## Automated',
    auto,
    '',
    '## Playwright',
    `Chromium mobile: ${evidence.playwright?.chromiumMobile ? 'yes' : 'no'} · WebKit mobile: ${evidence.playwright?.webkitMobile ? 'yes' : 'no'}`,
    `Viewports: ${(evidence.playwright?.viewports ?? []).join(', ')}`,
    'Mixed-rate Apply to all honesty: unit `collectionSameForAll.spec.ts` (not a Playwright mixed-rate journey).',
    '',
    '## Devices (not viewport emulation)',
    devices || '(none)',
    '',
    evidence.exception?.reason
      ? `## Exception\n${evidence.exception.reason}\nFollow-up: ${evidence.exception.followUp}\nBy: ${evidence.exception.recordedBy}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function loadOrCreate(gitSha, root) {
  return readEvidence(gitSha, root) ?? emptyEvidence({ version: readVersionFile(root), gitSha });
}

function runPnpm(args, root) {
  const result = spawnSync('pnpm', args, { cwd: root, stdio: 'inherit', shell: true, env: process.env });
  return result.status === 0;
}

export function recordAutomated(evidence, results) {
  const next = {
    ...evidence,
    automated: { ...evidence.automated, ...results },
  };
  next.decision = computeDecision(next);
  return next;
}

function cmdCheck(root) {
  const gitSha = headSha(root);
  let evidence = loadOrCreate(gitSha, root);
  evidence.version = readVersionFile(root);
  evidence.gitSha = gitSha;
  const results = {};
  for (const step of AUTOMATED_STEPS) {
    process.stdout.write(`\n→ pnpm ${step.args.join(' ')}\n`);
    results[step.key] = runPnpm(step.args, root) ? 'pass' : 'fail';
    if (results[step.key] === 'fail') {
      evidence = recordAutomated(evidence, results);
      writeEvidence(evidence, root);
      process.stdout.write(`\n${formatReport(evidence)}\n`);
      process.exitCode = 1;
      return;
    }
  }
  evidence = recordAutomated(evidence, results);
  writeEvidence(evidence, root);
  process.stdout.write(`\n${formatReport(evidence)}\n`);
  process.stdout.write(`Wrote ${evidencePath(gitSha, root)}\n`);
  if (evidence.decision === 'BLOCKED') process.exitCode = 1;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[key] = true;
      else {
        out[key] = next;
        i += 1;
      }
    } else out._.push(token);
  }
  return out;
}

function cmdSignoff(root, flags) {
  const gitSha = headSha(root);
  const evidence = readEvidence(gitSha, root);
  if (!evidence) {
    throw new Error(`No evidence for ${gitSha}. Run pnpm release:check first.`);
  }
  const next = applySignoff(evidence, {
    platform: flags.platform,
    mode: flags.mode,
    result: flags.result ?? 'pass',
    tester: flags.tester ?? process.env.USERNAME ?? process.env.USER ?? '',
    os: flags.os ?? '',
    notes: flags.notes ?? '',
  });
  writeEvidence(next, root);
  process.stdout.write(`${formatReport(next)}\n`);
}

function cmdException(root, flags) {
  const gitSha = headSha(root);
  const evidence = readEvidence(gitSha, root);
  if (!evidence) {
    throw new Error(`No evidence for ${gitSha}. Run pnpm release:check first.`);
  }
  const next = applyException(evidence, {
    reason: flags.reason,
    followUp: flags['follow-up'] ?? flags.followUp,
    recordedBy: flags['recorded-by'] ?? flags.recordedBy ?? process.env.USERNAME ?? process.env.USER ?? '',
  });
  writeEvidence(next, root);
  process.stdout.write(`${formatReport(next)}\n`);
}

export function cmdAssert(root = DEFAULT_ROOT, { deployment, gitSha } = {}) {
  const flavour = deployment ?? readDeployment({ dockerEnvText: readDockerEnvText(process.env, root) });
  const sha = gitSha ?? headSha(root);
  const evidence = readEvidence(sha, root);
  const result = maybeAssertProduction({ deployment: flavour, gitSha: sha, evidence });
  if (result.skipped) {
    process.stdout.write(`Release gate skipped (EKUM_DEPLOYMENT=${flavour}).\n`);
    return result;
  }
  process.stdout.write(`Release gate ${result.decision} for ${sha.slice(0, 7)}.\n`);
  return result;
}

async function cmdPost(root) {
  const gitSha = headSha(root);
  const origin = (process.env.EKUM_WEB_URL ?? 'http://127.0.0.1:8080').replace(/\/$/, '');
  const healthUrl = `${origin}/api/v1/health`;
  const versionUrl = `${origin}/api/v1/version`;
  process.stdout.write(`GET ${healthUrl}\n`);
  const healthRes = await fetch(healthUrl);
  if (!healthRes.ok) {
    throw new Error(`Post-deploy health failed: ${healthRes.status} ${await healthRes.text()}`);
  }
  process.stdout.write(`GET ${versionUrl}\n`);
  const versionRes = await fetch(versionUrl);
  if (!versionRes.ok) {
    throw new Error(`Post-deploy version failed: ${versionRes.status} ${await versionRes.text()}`);
  }
  const body = await versionRes.json();
  const deployed = body.gitSha ?? body.git_sha ?? '';
  if (deployed && deployed !== gitSha && !gitSha.startsWith(deployed) && !deployed.startsWith(gitSha)) {
    throw new Error(
      `Deployed gitSha ${deployed} does not match HEAD ${gitSha}. Do not auto-rollback — fix forward or check out the previous SHA and docker:up again.`,
    );
  }
  process.stdout.write(`Version ok (${body.version} ${String(deployed).slice(0, 7)}).\n`);
  process.stdout.write('→ pnpm test:e2e:smoke:docker\n');
  if (!runPnpm(['test:e2e:smoke:docker'], root)) {
    throw new Error(
      'Post-deploy smoke failed. Do not auto-rollback. Inspect Playwright report, then fix forward or rebuild the previous SHA.',
    );
  }
  process.stdout.write('Post-deploy smoke passed.\n');
}

const isMain =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const flags = parseArgs(process.argv.slice(2));
  const command = flags._[0] ?? 'assert';
  const root = DEFAULT_ROOT;
  try {
    if (command === 'check') cmdCheck(root);
    else if (command === 'signoff') cmdSignoff(root, flags);
    else if (command === 'exception') cmdException(root, flags);
    else if (command === 'assert') cmdAssert(root);
    else if (command === 'post') {
      await cmdPost(root);
    } else {
      throw new Error(`Unknown command ${command}. Use check | signoff | exception | assert | post.`);
    }
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : err}\n`);
    process.exitCode = 1;
  }
}
