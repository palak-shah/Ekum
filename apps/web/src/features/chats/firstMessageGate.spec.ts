import { describe, expect, it } from 'vitest';
import { coldMessageAction } from './firstMessageGate';

describe('coldMessageAction', () => {
  it('opens existing Direct', () => {
    expect(coldMessageAction({ existingThreadId: 't1' })).toBe('open-existing');
  });

  it('composes when no Direct yet', () => {
    expect(coldMessageAction({ existingThreadId: null })).toBe('compose-first');
    expect(coldMessageAction({ existingThreadId: undefined })).toBe('compose-first');
  });
});
