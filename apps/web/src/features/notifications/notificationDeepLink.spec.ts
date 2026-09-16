import { describe, expect, it } from 'vitest';
import { notificationDeepLink } from './notificationDeepLink';

describe('notificationDeepLink', () => {
  it('maps every supported refType', () => {
    expect(notificationDeepLink({ refType: 'order', refId: 'o1' })).toBe('/orders/o1');
    expect(notificationDeepLink({ refType: 'thread', refId: 't1' })).toBe('/chats/t1');
    expect(notificationDeepLink({ refType: 'company', refId: 'c1' })).toBe('/company/c1');
    expect(notificationDeepLink({ refType: 'collection', refId: 'col1' })).toBe('/collections/col1');
    expect(notificationDeepLink({ refType: 'product', refId: 'p1' })).toBe('/explore/products/p1');
    expect(notificationDeepLink({ refType: 'broadcast', refId: 'b1' })).toBe('/broadcast');
  });

  it('falls back to inbox for missing or unknown refs', () => {
    expect(notificationDeepLink({ refType: null, refId: null })).toBe('/notifications');
    expect(notificationDeepLink({ refType: 'return', refId: 'r1' })).toBe('/notifications');
    expect(notificationDeepLink({ refType: 'order', refId: null })).toBe('/orders');
  });
});
