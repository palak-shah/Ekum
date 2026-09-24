import { describe, expect, it, beforeEach } from 'vitest';
import { getChatDraft, resetChatDrafts, setChatDraft, subscribeChatDrafts } from './chatsDrafts';

describe('chatsDrafts', () => {
  beforeEach(() => {
    resetChatDrafts();
  });

  it('stores and clears a half-typed note', () => {
    setChatDraft('t1', '  wait  ');
    expect(getChatDraft('t1')).toBe('  wait  ');
    setChatDraft('t1', '   ');
    expect(getChatDraft('t1')).toBe('');
  });

  it('notifies subscribers', () => {
    let n = 0;
    const off = subscribeChatDrafts(() => {
      n += 1;
    });
    setChatDraft('t1', 'hi');
    expect(n).toBe(1);
    off();
    setChatDraft('t1', 'bye');
    expect(n).toBe(1);
  });
});
