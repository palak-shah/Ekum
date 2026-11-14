import { describe, expect, it } from 'vitest';
import { staysOnThreadAfterInboxAction } from './threadInboxStay';

describe('staysOnThreadAfterInboxAction', () => {
  it('keeps clear and unread on the open thread', () => {
    expect(staysOnThreadAfterInboxAction('clear')).toBe(true);
    expect(staysOnThreadAfterInboxAction('unread')).toBe(true);
  });

  it('leaves after archive or delete', () => {
    expect(staysOnThreadAfterInboxAction('archive')).toBe(false);
    expect(staysOnThreadAfterInboxAction('delete')).toBe(false);
  });
});
