import { describe, expect, it } from 'vitest';
import { toCursorPage } from './pagination';

describe('toCursorPage', () => {
  it('emits a nextCursor when an extra row was fetched', () => {
    const page = toCursorPage([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 2, (row) => row.id);
    expect(page.results).toEqual(['a', 'b']);
    expect(page.nextCursor).toBe('b');
  });

  it('returns a null cursor on the last page', () => {
    const page = toCursorPage([{ id: 'a' }], 2, (row) => row.id);
    expect(page.results).toEqual(['a']);
    expect(page.nextCursor).toBeNull();
  });

  it('returns a null cursor for an empty result set', () => {
    const page = toCursorPage([] as { id: string }[], 20, (row) => row.id);
    expect(page.results).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});
