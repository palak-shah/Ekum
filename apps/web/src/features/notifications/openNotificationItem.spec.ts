import { describe, expect, it, vi } from 'vitest';
import { openNotificationItem } from './openNotificationItem';

describe('openNotificationItem', () => {
  it('marks unread then navigates to deep link', async () => {
    const markRead = vi.fn(async () => undefined);
    const navigate = vi.fn();
    await openNotificationItem({
      item: { id: 'n1', read: false, refType: 'order', refId: 'ord-1' },
      markRead,
      navigate,
    });
    expect(markRead).toHaveBeenCalledWith('n1');
    expect(navigate).toHaveBeenCalledWith('/orders/ord-1');
  });

  it('skips mark-read when already read', async () => {
    const markRead = vi.fn(async () => undefined);
    const navigate = vi.fn();
    await openNotificationItem({
      item: { id: 'n2', read: true, refType: 'thread', refId: 'th-1' },
      markRead,
      navigate,
    });
    expect(markRead).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/chats/th-1');
  });

  it('navigates even if mark-read fails', async () => {
    const markRead = vi.fn(async () => {
      throw new Error('network');
    });
    const navigate = vi.fn();
    await openNotificationItem({
      item: { id: 'n3', read: false, refType: 'collection', refId: 'col-1' },
      markRead,
      navigate,
    });
    expect(navigate).toHaveBeenCalledWith('/collections/col-1');
  });
});
