import { describe, expect, it } from 'vitest';
import { formatFileSize } from './format';

describe('formatFileSize', () => {
  it('formats bytes for document cards', () => {
    expect(formatFileSize(null)).toBeNull();
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(15_000)).toBe('15 KB');
    expect(formatFileSize(1_500_000)).toBe('1.4 MB');
  });
});
