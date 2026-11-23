import { describe, expect, it } from 'vitest';
import { textMessage } from '@/test/messageFixtures';
import {
  isChatSystemNotice,
  isOrderTaggedUpdate,
  orderTagQuotePreview,
  orderTaggedUpdateText,
  repostEditInvalidatedCollectionPath,
  shareRevokedNoticeText,
} from './chatSystemNotice';

describe('isChatSystemNotice', () => {
  it('treats leave lines as centered notices', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        body: 'Priya left',
        metadata: { kind: 'member_left' },
      } as never),
    ).toBe(true);
    expect(
      isChatSystemNotice({
        type: 'system',
        metadata: { kind: 'company_left', companyId: 'c1' },
      }),
    ).toBe(true);
  });

  it('treats Repost-off as a centered notice', () => {
    const message = {
      type: 'system',
      body: 'You turned off Repost for Trader 1',
      metadata: {
        kind: 'share_revoked',
        millCompanyId: 'mill',
        traderCompanyId: 'trader',
        millName: 'Supplier 1',
        traderName: 'Trader 1',
      },
    };
    expect(isChatSystemNotice(message)).toBe(true);
  });

  it('treats Edit-rate invalidated as a centered notice with pack path', () => {
    const message = {
      type: 'system',
      body: 'Surat Silk changed rates for Wedding Edit — set your rate again.',
      metadata: {
        kind: 'repost_edit_rate_invalidated',
        collectionId: 'child-1',
        path: '/collections/child-1',
      },
    };
    expect(isChatSystemNotice(message)).toBe(true);
    expect(repostEditInvalidatedCollectionPath(message)).toBe('/collections/child-1');
  });
});

describe('shareRevokedNoticeText', () => {
  const meta = {
    kind: 'share_revoked',
    millCompanyId: 'mill',
    traderCompanyId: 'trader',
    millName: 'Supplier 1',
    traderName: 'Trader 1',
  };

  it('names who acted for mill and trader', () => {
    expect(shareRevokedNoticeText({ metadata: meta }, 'mill')).toBe(
      'You turned off Repost for Trader 1',
    );
    expect(shareRevokedNoticeText({ metadata: meta }, 'trader')).toBe(
      'Supplier 1 turned off Repost for you · Request',
    );
  });

  it('uses mine when viewer id is omitted', () => {
    expect(shareRevokedNoticeText({ metadata: meta, mine: true })).toBe(
      'You turned off Repost for Trader 1',
    );
    expect(shareRevokedNoticeText({ metadata: meta, mine: false })).toBe(
      'Supplier 1 turned off Repost for you · Request',
    );
  });

  it('returns null for other system kinds', () => {
    expect(
      shareRevokedNoticeText({ metadata: { kind: 'member_left' }, body: 'Left' }),
    ).toBeNull();
  });
});

describe('isChatSystemNotice extras', () => {
  it('keeps company-side and order/ask system cards out', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        metadata: { side: 'company', companyId: 'c1' },
      }),
    ).toBe(false);
    expect(
      isChatSystemNotice({
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_lines' },
      }),
    ).toBe(false);
  });

  it('does not treat order_lifecycle or notes as centered notices', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_lifecycle', event: 'lines_decided' },
      }),
    ).toBe(false);
    expect(
      isChatSystemNotice({
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_note', event: 'noted' },
      }),
    ).toBe(false);
    expect(
      isOrderTaggedUpdate({
        type: 'system',
        metadata: { kind: 'order_lifecycle', event: 'order_dispatched' },
      }),
    ).toBe(true);
  });

  it('rewrites note and dispatch copy with You / shop', () => {
    expect(
      orderTaggedUpdateText(
        textMessage({
          id: 'n1',
          type: 'system',
          mine: true,
          body: 'Buyer added a note',
          metadata: { kind: 'order_note', actorLabel: 'Buyer' },
        }),
      ),
    ).toBe('You added a note');
    expect(
      orderTaggedUpdateText(
        textMessage({
          id: 'd1',
          type: 'system',
          mine: false,
          body: 'Seller dispatched',
          metadata: { kind: 'order_lifecycle', event: 'order_dispatched', actorLabel: 'Ravi' },
          reference: { counterpartName: 'Ravi Silk' } as never,
        }),
      ),
    ).toBe('Ravi dispatched');
  });

  it('order tag preview is Order # not Reply chrome data', () => {
    const preview = orderTagQuotePreview(
      textMessage({
        id: 't1',
        type: 'system',
        metadata: { kind: 'order_lifecycle', event: 'order_dispatched', livingMessageId: 'live' },
        replyTo: {
          id: 'live',
          type: 'order_card',
          bodyPreview: 'Quote',
          available: true,
        },
        reference: {
          kind: 'order',
          id: 'o1',
          name: 'Order #15P1',
          image: null,
          available: true,
          orderLabel: 'Order #15P1',
        },
      }),
    );
    expect(preview?.bodyPreview).toBe('Order #15P1');
    expect(preview?.id).toBe('live');
  });
});
