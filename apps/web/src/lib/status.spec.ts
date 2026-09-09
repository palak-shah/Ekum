import { describe, expect, it } from 'vitest';
import { statusLabel, statusTone } from '@/lib/status';

describe('statusTone order close states', () => {
  it('treats full dispatch as complete (success), not in-progress', () => {
    expect(statusTone('dispatched')).toBe('success');
    expect(statusTone('settled')).toBe('success');
    expect(statusTone('delivered')).toBe('success');
    expect(statusTone('confirmed')).toBe('progress');
  });
});

describe('statusLabel order complete', () => {
  it('names both terminal success states as complete', () => {
    expect(statusLabel('dispatched')).toBe('Dispatched · complete');
    expect(statusLabel('settled')).toBe('Settled · complete');
  });
});
