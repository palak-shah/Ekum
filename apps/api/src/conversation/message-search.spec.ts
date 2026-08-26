import { describe, expect, it } from 'vitest';
import { MessageType, OrderChatEvent } from '@ekum/domain-types';
import { formatSearchHitPreview, threadSurfaceMatchesQ } from './message-search';

describe('formatSearchHitPreview', () => {
  it('formats order label with short event', () => {
    expect(
      formatSearchHitPreview({
        type: MessageType.OrderCard,
        body: null,
        metadata: { orderLabel: 'Order #OKYD', event: OrderChatEvent.OrderRequested },
      }),
    ).toBe('In chat · Order #OKYD · Requested');
  });

  it('formats shared design/collection name', () => {
    expect(
      formatSearchHitPreview({
        type: MessageType.ProductCard,
        body: null,
        metadata: null,
        catalogName: 'Organza Festive',
      }),
    ).toBe('In chat · Shared: Organza Festive');
  });

  it('formats text snippet', () => {
    expect(
      formatSearchHitPreview({
        type: MessageType.Text,
        body: 'hello there wedding edit please send rates',
        metadata: null,
      }),
    ).toBe('In chat · hello there wedding edit please send rat…');
  });
});

describe('threadSurfaceMatchesQ', () => {
  it('matches counterpart name case-insensitively', () => {
    expect(
      threadSurfaceMatchesQ({
        title: null,
        counterpartName: 'Ahmedabad Loom Co',
        counterpartCity: 'Surat',
        q: 'loom',
      }),
    ).toBe(true);
  });

  it('rejects unrelated needle', () => {
    expect(
      threadSurfaceMatchesQ({
        title: null,
        counterpartName: 'Ahmedabad Loom Co',
        counterpartCity: 'Surat',
        q: 'okyd',
      }),
    ).toBe(false);
  });
});
