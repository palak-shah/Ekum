import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * BM: chat Document PDF click must not hit SPA navigateFallback.
 * Regression: vite PWA workbox must denylist /media (and /api).
 */
describe('PWA navigateFallbackDenylist (chat PDF open)', () => {
  it('denylists /media and /api so document navigations are not index.html', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const viteConfig = readFileSync(join(here, '../../vite.config.ts'), 'utf8');
    expect(viteConfig).toContain('navigateFallbackDenylist');
    expect(viteConfig).toContain('/^\\/media/');
    expect(viteConfig).toContain('/^\\/api/');
  });
});
