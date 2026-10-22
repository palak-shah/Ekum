import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  REQUIRED_AUTOMATED,
  applyException,
  applySignoff,
  assertProductionReady,
  computeDecision,
  emptyEvidence,
  formatReport,
  maybeAssertProduction,
  productionGateRequired,
  readDeployment,
  readEvidence,
  recordAutomated,
  writeEvidence,
} from './release-gate.mjs';

function passing(gitSha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1') {
  const evidence = emptyEvidence({ version: '0.1.1', gitSha });
  for (const key of REQUIRED_AUTOMATED) evidence.automated[key] = 'pass';
  evidence.decision = computeDecision(evidence);
  return evidence;
}

function allDevicesPass(evidence, tester = 'darsh') {
  let next = evidence;
  for (const row of [
    ['android', 'chrome'],
    ['android', 'pwa'],
    ['iphone', 'safari'],
    ['iphone', 'pwa'],
  ]) {
    next = applySignoff(next, { platform: row[0], mode: row[1], result: 'pass', tester });
  }
  return next;
}

describe('release-gate', () => {
  it('treats only the string production as gated', () => {
    assert.equal(productionGateRequired('production'), true);
    assert.equal(productionGateRequired('test'), false);
    assert.equal(readDeployment({ env: {}, dockerEnvText: 'EKUM_DEPLOYMENT=test\n' }), 'test');
    assert.equal(readDeployment({ env: { EKUM_DEPLOYMENT: 'production' } }), 'production');
  });

  it('skips assert when deployment is test', () => {
    const result = maybeAssertProduction({
      deployment: 'test',
      gitSha: 'abc',
      evidence: null,
    });
    assert.deepEqual(result, { skipped: true, decision: null });
  });

  it('production docker-up path throws without evidence', () => {
    assert.throws(
      () =>
        maybeAssertProduction({
          deployment: 'production',
          gitSha: 'aaa111bbb222ccc333ddd444eee555fff666aaa1',
          evidence: null,
        }),
      /no evidence/,
    );
  });

  it('blocks missing evidence, SHA mismatch, and AWAITING_DEVICE', () => {
    const sha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1';
    assert.throws(() => assertProductionReady({ gitSha: sha, evidence: null }), /no evidence/);
    assert.throws(
      () => assertProductionReady({ gitSha: sha, evidence: passing('other') }),
      /does not match HEAD/,
    );
    assert.throws(
      () => assertProductionReady({ gitSha: sha, evidence: passing(sha) }),
      /AWAITING_DEVICE/,
    );
  });

  it('blocks BLOCKED even when devices passed', () => {
    const sha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1';
    let evidence = passing(sha);
    evidence = recordAutomated(evidence, { lint: 'fail' });
    evidence = allDevicesPass(evidence);
    assert.equal(evidence.decision, 'BLOCKED');
    assert.throws(() => assertProductionReady({ gitSha: sha, evidence }), /BLOCKED/);
  });

  it('mentions mixed-rate unit coverage in the report', () => {
    const report = formatReport(passing());
    assert.match(report, /collectionSameForAll\.spec\.ts/);
  });

  it('allows PASS when automated and four device modes pass', () => {
    const sha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1';
    const evidence = allDevicesPass(passing(sha));
    assert.equal(evidence.decision, 'PASS');
    assert.equal(assertProductionReady({ gitSha: sha, evidence }), 'PASS');
  });

  it('rejects exception without reason or with failed automated', () => {
    const sha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1';
    assert.throws(
      () => applyException(passing(sha), { reason: '', followUp: 'later', recordedBy: 'darsh' }),
      /needs --reason/,
    );
    const failed = recordAutomated(passing(sha), { unit: 'fail' });
    assert.throws(
      () =>
        applyException(failed, {
          reason: 'hotfix',
          followUp: 'device by Friday',
          recordedBy: 'darsh',
        }),
      /red suite/,
    );
  });

  it('allows EXCEPTION_APPROVED when automated passed and device skipped', () => {
    const sha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1';
    const evidence = applyException(passing(sha), {
      reason: 'otp outage hotfix',
      followUp: 'device pass by 2026-10-23',
      recordedBy: 'darsh',
    });
    assert.equal(evidence.decision, 'EXCEPTION_APPROVED');
    assert.equal(assertProductionReady({ gitSha: sha, evidence }), 'EXCEPTION_APPROVED');
  });

  it('does not treat a stored EXCEPTION_APPROVED as ready when exception fields are empty', () => {
    const sha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1';
    const evidence = passing(sha);
    evidence.decision = 'EXCEPTION_APPROVED';
    assert.throws(
      () => assertProductionReady({ gitSha: sha, evidence }),
      /AWAITING_DEVICE/,
    );
  });

  it('writes and reads evidence for a SHA', () => {
    const root = mkdtempSync(join(tmpdir(), 'ekum-release-'));
    mkdirSync(join(root, 'docs', 'superpowers', 'qa', 'releases'), { recursive: true });
    writeFileSync(join(root, 'VERSION'), '0.1.1\n');
    const sha = 'aaa111bbb222ccc333ddd444eee555fff666aaa1';
    const evidence = allDevicesPass(passing(sha));
    writeEvidence(evidence, root);
    const loaded = readEvidence(sha, root);
    assert.equal(loaded.decision, 'PASS');
    assert.equal(loaded.version, '0.1.1');
  });
});
