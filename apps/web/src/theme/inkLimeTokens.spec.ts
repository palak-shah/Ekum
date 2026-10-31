import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Completeness 2026-10-29-ekum-ink-lime — light charcoal / lime jobs. */
describe('Ink & Lime tokens', () => {
  const tokens = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');
  const light = tokens.slice(0, tokens.indexOf('html.dark {'));

  it('uses charcoal for actions and lime only for counts', () => {
    expect(light).toContain('--ekum-accent: #1f2a30');
    expect(light).toContain('--ekum-on-accent: #ffffff');
    expect(light).toContain('--ekum-badge: #dfd76b');
    expect(light).toContain('--ekum-badge-ink: #1f2406');
    expect(light).toContain('--ekum-accent-soft: #f5f5f5');
    expect(light).toContain('--ekum-accent-ink: #1f2a30');
    expect(light).toContain('--ekum-tick: #34b7f1');
    expect(light).toContain('--ekum-chat-out: #eef2c8');
    expect(light).toContain('--ekum-chip-on: #eff1d6');
    expect(light).toContain('--ekum-chip-on-ink: #3f4a12');
  });

  it('maps the colour jobs in Tailwind', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toContain("--font-sans: 'Noto Sans'");
    expect(css).toContain('--color-accent-soft: var(--ekum-accent-soft)');
    expect(css).toContain('--color-on-accent: var(--ekum-on-accent)');
    expect(css).toContain('--color-badge-ink: var(--ekum-badge-ink)');
    expect(css).toContain('--color-tick: var(--ekum-tick)');
    expect(css).toContain('--color-chip-on: var(--ekum-chip-on)');
    expect(css).toContain('--color-chip-on-ink: var(--ekum-chip-on-ink)');
  });

  it('defines a float shadow for attached menus (no hairline box)', () => {
    expect(tokens).toContain('--ekum-shadow-menu:');
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toContain('--shadow-menu: var(--ekum-shadow-menu)');
  });
});
