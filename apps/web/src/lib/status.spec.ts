import { describe, expect, it } from 'vitest';
import { statusClasses, statusLabel, statusTone } from '@/lib/status';

describe('statusTone order close states', () => {
  it('treats full dispatch as complete (success), not in-progress', () => {
    expect(statusTone('dispatched')).toBe('success');
    expect(statusTone('settled')).toBe('success');
    expect(statusTone('delivered')).toBe('success');
  });

  it('keeps placed / confirmed / part shipped on distinct hues', () => {
    expect(statusTone('requested')).toBe('placed');
    expect(statusLabel('requested')).toBe('Placed');
    expect(statusTone('confirmed')).toBe('confirmed');
    expect(statusTone('part_shipped')).toBe('part');
    expect(statusTone('declined')).toBe('danger');
    expect(statusClasses('requested')).not.toBe(statusClasses('confirmed'));
    expect(statusClasses('confirmed')).not.toBe(statusClasses('part_shipped'));
    expect(statusClasses('part_shipped')).not.toBe(statusClasses('dispatched'));
  });

  it('keeps complaint open and resolved distinct from each other and from dispatched', () => {
    expect(statusTone('open')).toBe('info');
    expect(statusTone('resolved')).toBe('resolved');
    expect(statusClasses('open')).not.toBe(statusClasses('resolved'));
    expect(statusClasses('resolved')).not.toBe(statusClasses('dispatched'));
  });
});

describe('statusLabel order complete', () => {
  it('names both terminal success states as complete', () => {
    expect(statusLabel('dispatched')).toBe('Dispatched · complete');
    expect(statusLabel('settled')).toBe('Settled · complete');
  });
});
