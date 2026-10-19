/**
 * Client (PWA) release + build identity baked at Vite build time.
 * Never hardcode labels in UI — read from import.meta.env / these helpers.
 */

export type AppVersionIdentity = {
  version: string;
  buildId: string;
  gitSha: string;
  builtAt: string;
  deployment: 'production' | 'test';
};

export type ApiVersionIdentity = {
  service: string;
  version: string;
  buildId: string;
  gitSha: string;
  builtAt: string;
  deployment: 'production' | 'test';
};

function envString(key: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/** Short SHA for badges (7 chars) when a full hash is present. */
export function shortGitSha(gitSha: string): string {
  if (!gitSha || gitSha === 'unknown') return 'unknown';
  return gitSha.slice(0, 7);
}

export function clientAppVersion(): AppVersionIdentity {
  const buildId =
    envString('VITE_WEB_BUILD', '') ||
    envString('VITE_EKUM_BUILD_ID', '') ||
    'dev';
  const deploymentRaw = envString('VITE_EKUM_DEPLOYMENT', 'test');
  const deployment = deploymentRaw === 'production' ? 'production' : 'test';
  return {
    version: envString('VITE_EKUM_VERSION', '0.0.0-dev'),
    buildId,
    gitSha: envString('VITE_EKUM_GIT_SHA', 'unknown'),
    builtAt: envString('VITE_EKUM_BUILT_AT', 'unknown'),
    deployment,
  };
}

/** True when this build should show the discreet TEST badge. */
export function isNonProductionDeployment(deployment = clientAppVersion().deployment): boolean {
  return deployment !== 'production';
}

/** Quiet label: TEST · 0.1.0 · abc1234 */
export function testBadgeLabel(identity: Pick<AppVersionIdentity, 'version' | 'gitSha'>): string {
  return `TEST · ${identity.version} · ${shortGitSha(identity.gitSha)}`;
}
