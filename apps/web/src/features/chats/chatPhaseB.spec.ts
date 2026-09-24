import { describe, expect, it } from 'vitest';
import {
  isTypingFresh,
  messageBodyHasLink,
  outgoingSeenLabel,
  TYPING_STALE_MS,
} from '@ekum/domain-types';

describe('chat Phase B helpers', () => {
  it('marks Seen when the other shop read after our last outgoing', () => {
    expect(
      outgoingSeenLabel({
        threadType: 'direct',
        lastOutgoingCreatedAt: '2026-09-23T10:00:00.000Z',
        counterpartLastReadAt: '2026-09-23T10:01:00.000Z',
      }),
    ).toBe('Seen');
    expect(
      outgoingSeenLabel({
        threadType: 'direct',
        lastOutgoingCreatedAt: '2026-09-23T10:02:00.000Z',
        counterpartLastReadAt: '2026-09-23T10:01:00.000Z',
      }),
    ).toBeNull();
    expect(
      outgoingSeenLabel({
        threadType: 'group',
        lastOutgoingCreatedAt: '2026-09-23T10:00:00.000Z',
        counterpartLastReadAt: '2026-09-23T10:01:00.000Z',
      }),
    ).toBeNull();
  });

  it('treats typing older than the stale window as off', () => {
    const now = Date.parse('2026-09-23T12:00:00.000Z');
    expect(isTypingFresh(new Date(now - 1_000).toISOString(), now)).toBe(true);
    expect(isTypingFresh(new Date(now - TYPING_STALE_MS - 1).toISOString(), now)).toBe(false);
    expect(isTypingFresh(null, now)).toBe(false);
  });

  it('detects http and www links in text', () => {
    expect(messageBodyHasLink('see https://ekum.app/s/x')).toBe(true);
    expect(messageBodyHasLink('www.suratsilk.in')).toBe(true);
    expect(messageBodyHasLink('rate 42')).toBe(false);
  });
});
