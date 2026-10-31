import { describe, expect, it } from 'vitest';
import { MessageType } from '@ekum/domain-types';
import {
  inboxLastPhotoUrl,
  inboxObjectLabel,
  inboxPreviewTypeKey,
  messagePreviewText,
} from './messagePreview';

function msg(
  partial: Partial<{
    type: string;
    body: string | null;
    mine: boolean;
    metadata: Record<string, unknown>;
  }>,
) {
  return {
    id: 'm1',
    type: MessageType.Text,
    body: null,
    mine: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    senderCompanyId: 'c1',
    metadata: null,
    reference: null,
    ...partial,
  } as Parameters<typeof messagePreviewText>[0];
}

describe('messagePreviewText', () => {
  it('shows Voice for voice clips instead of the media URL', () => {
    expect(
      messagePreviewText(
        msg({
          type: MessageType.Voice,
          body: 'https://host/media/c1/clip.webm',
          metadata: { durationMs: 1200 },
        }),
      ),
    ).toBe('Voice');
  });

  it('prefixes Voice when the clip is mine', () => {
    expect(
      messagePreviewText(
        msg({
          type: MessageType.Voice,
          body: 'https://host/media/c1/clip.webm',
          mine: true,
          metadata: { durationMs: 1200 },
        }),
      ),
    ).toBe('You · Voice');
  });
});

describe('order lifecycle inbox preview', () => {
  it('shows You/shop tag copy, not You · prefix', () => {
    expect(
      messagePreviewText(
        msg({
          type: MessageType.System,
          mine: true,
          body: 'Surat Silk House confirmed',
          metadata: {
            kind: 'order_lifecycle',
            event: 'lines_decided',
            actorLabel: 'Surat Silk House',
            confirmedCount: 2,
          },
        }),
      ),
    ).toBe('You confirmed');
    expect(
      messagePreviewText(
        msg({
          type: MessageType.System,
          mine: false,
          body: 'Surat Silk House confirmed',
          metadata: {
            kind: 'order_lifecycle',
            event: 'lines_decided',
            actorLabel: 'Surat Silk House',
          },
        }),
      ),
    ).toBe('Surat Silk House confirmed');
  });
});

describe('inboxPreviewTypeKey', () => {
  it('keeps voice for the inbox kind icon', () => {
    expect(
      inboxPreviewTypeKey(
        msg({ type: MessageType.Voice, body: 'https://host/media/c1/clip.webm' }),
      ),
    ).toBe('voice');
  });
});

describe('inboxLastPhotoUrl', () => {
  it('does not use text or order bodies as image src', () => {
    expect(
      inboxLastPhotoUrl(
        msg({ type: MessageType.Text, body: "Hi — I'd like to connect to see…" }),
      ),
    ).toBeNull();
    expect(
      inboxLastPhotoUrl(msg({ type: MessageType.OrderCard, body: 'Order #FS3C Accepted' })),
    ).toBeNull();
  });

  it('rewrites a real photo URL onto the page origin', () => {
    expect(
      inboxLastPhotoUrl(
        msg({
          type: MessageType.Photo,
          body: 'http://localhost:8080/media/c1/a.jpg',
          metadata: { urls: ['http://localhost:8080/media/c1/a.jpg'] },
        }),
      ),
    ).toMatch(/^https?:\/\/.+\/media\/c1\/a\.jpg$/);
  });
});

describe('inboxObjectLabel', () => {
  it('names order and photo threads, not plain text', () => {
    expect(inboxObjectLabel('order_card')).toBe('Order');
    expect(inboxObjectLabel('photo')).toBe('Photo');
    expect(inboxObjectLabel('text')).toBeNull();
    expect(inboxObjectLabel(null)).toBeNull();
  });
});
