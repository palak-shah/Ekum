import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Completeness 2026-10-17-typography-weight — semantic weight tokens stay wired. */
describe('typography weight tokens', () => {
  it('defines body / emphasis / title weights in tokens.css', () => {
    const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');
    expect(css).toContain('--ekum-weight-body: 400');
    expect(css).toContain('--ekum-weight-emphasis: 500');
    expect(css).toContain('--ekum-weight-title: 600');
  });

  it('maps weight tokens to Tailwind font utilities in index.css', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toContain('--font-weight-body: var(--ekum-weight-body)');
    expect(css).toContain('--font-weight-emphasis: var(--ekum-weight-emphasis)');
    expect(css).toContain('--font-weight-title: var(--ekum-weight-title)');
  });

  it('defines the approved size steps and header utilities', () => {
    const tokens = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');
    expect(tokens).toContain('--ekum-text-badge: 10px');
    expect(tokens).toContain('--ekum-text-meta: 11px');
    expect(tokens).toContain('--ekum-text-support: 13px');
    expect(tokens).toContain('--ekum-text-name: 15px');
    expect(tokens).toContain('--ekum-text-page-title: 17px');
    expect(tokens).toContain('--ekum-text-sheet-title: 1.05rem');
    expect(tokens).toContain('--ekum-text-tab-title: 1.375rem');

    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toContain('--text-page-title: var(--ekum-text-page-title)');
    expect(css).toContain('--text-sheet-title: var(--ekum-text-sheet-title)');
    expect(css).toContain('--text-tab-title: var(--ekum-text-tab-title)');
    expect(css).toContain('--text-page-title--line-height: inherit');
  });
});
