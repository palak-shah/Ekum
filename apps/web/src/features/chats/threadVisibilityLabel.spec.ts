import { describe, expect, it } from 'vitest';
import { threadVisibilityLabel, threadVisibilitySubtitle } from './threadVisibilityLabel';

describe('threadVisibilityLabel', () => {
  it('does not label chats Team or Private', () => {
    expect(threadVisibilityLabel({ type: 'direct', visibility: 'shared' })).toBeNull();
    expect(threadVisibilityLabel({ type: 'direct', visibility: 'owner_only' })).toBeNull();
    expect(threadVisibilityLabel({ type: 'group', visibility: 'shared' })).toBeNull();
  });

  it('keeps city as the header subtitle', () => {
    expect(threadVisibilitySubtitle(null, 'Surat')).toBe('Surat');
  });
});
