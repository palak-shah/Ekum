import { describe, expect, it } from 'vitest';
import { avatarTone } from './avatarTone';

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
});
