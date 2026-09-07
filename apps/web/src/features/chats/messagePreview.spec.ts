import { describe, expect, it } from 'vitest';
import { MessageType } from '@ekum/domain-types';
import { inboxPreviewTypeKey, messagePreviewText } from './messagePreview';

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

describe('inboxPreviewTypeKey', () => {
  it('keeps voice for the inbox kind icon', () => {
    expect(
      inboxPreviewTypeKey(
        msg({ type: MessageType.Voice, body: 'https://host/media/c1/clip.webm' }),
      ),
    ).toBe('voice');
  });
});
