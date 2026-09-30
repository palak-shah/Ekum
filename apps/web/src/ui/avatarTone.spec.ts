import { describe, expect, it } from 'vitest';
import { AVATAR_TONES, avatarTone } from './avatarTone';

describe('avatarTone', () => {
  it('is stable for the same name', () => {
    expect(avatarTone('Surat Silk House')).toBe(avatarTone('Surat Silk House'));
  });

  it('gives different shops different colours', () => {
    expect(avatarTone('DAILY DOCUMENTS')).not.toBe(avatarTone('EKUM'));
    expect(avatarTone('EKUM')).not.toBe(avatarTone('Anupriya'));
  });

  it('treats blank like a fallback key', () => {
    expect(avatarTone('')).toBe(avatarTone('?'));
  });

  it('uses a pale wash and matching ink, not white on a loud disc', () => {
    for (const tone of AVATAR_TONES) {
      expect(tone.ink.toLowerCase()).not.toBe('#fff');
      expect(tone.ink.toLowerCase()).not.toBe('#ffffff');
      expect(['#e17076', '#7bc862', '#e5a84b', '#65aadd']).not.toContain(
        tone.bg.toLowerCase(),
      );
    }
    const tone = avatarTone('Surat Silk House');
    expect(tone.bg).toMatch(/^#/);
    expect(tone.ink).toMatch(/^#/);
  });
});
