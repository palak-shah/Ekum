import { describe, expect, it } from 'vitest';
import { threadDateChip, threadDateChipLabel } from './threadDateChip';

describe('threadDateChip', () => {
  const now = new Date(2026, 9, 30, 18, 0, 0);

  it('labels today, yesterday, same-year, and other-year', () => {
    expect(threadDateChipLabel(new Date(2026, 9, 30, 10, 50).toISOString(), now)).toBe(
      'Today',
    );
    expect(threadDateChipLabel(new Date(2026, 9, 29, 16, 5).toISOString(), now)).toBe(
      'Yesterday',
    );
    expect(threadDateChipLabel(new Date(2026, 9, 11, 9, 0).toISOString(), now)).toBe(
      '11 Oct',
    );
    expect(threadDateChipLabel(new Date(2025, 9, 11, 9, 0).toISOString(), now)).toBe(
      '11 Oct 2025',
    );
  });

  it('inserts a chip only when the calendar day changes', () => {
    const morning = new Date(2026, 9, 30, 10, 0).toISOString();
    const afternoon = new Date(2026, 9, 30, 16, 0).toISOString();
    const yesterday = new Date(2026, 9, 29, 16, 0).toISOString();
    expect(threadDateChip(null, morning, now)).toBe('Today');
    expect(threadDateChip(morning, afternoon, now)).toBeNull();
    expect(threadDateChip(yesterday, morning, now)).toBe('Today');
  });
});
