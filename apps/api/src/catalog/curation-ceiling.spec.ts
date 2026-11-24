import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  audienceRank,
  assertProductsCuratable,
  curatedPublishAllowDownload,
  curatedPublishAllowForward,
  curatedPublishRateVisibility,
} from './curation-ceiling';

function expectBadRequest(fn: () => void, code: string): void {
  try {
    fn();
    expect.fail(`expected ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({ code });
  }
}

describe('audienceRank', () => {
  it('orders selected < connections < followers < everyone', () => {
    expect(audienceRank('selected')).toBeLessThan(audienceRank('connections'));
    expect(audienceRank('connections')).toBeLessThan(audienceRank('followers'));
    expect(audienceRank('followers')).toBeLessThan(audienceRank('everyone'));
  });

  it('assigns fixed ranks', () => {
    expect(audienceRank('selected')).toBe(0);
    expect(audienceRank('connections')).toBe(1);
    expect(audienceRank('followers')).toBe(2);
    expect(audienceRank('everyone')).toBe(3);
  });

  it('rejects unknown audience', () => {
    expectBadRequest(() => audienceRank('unknown'), 'INVALID_PRODUCTS');
  });
});

describe('assertProductsCuratable', () => {
  const base = {
    id: 'p1',
    companyId: 'other',
    audience: 'everyone',
    allowForward: true,
    status: 'published',
    postedToMarketAt: new Date('2026-08-01'),
  };

  it('allows foreign locked product when RelistGrant is present', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [{ ...base, allowForward: false }],
        relistGrantedIds: new Set(['p1']),
      }),
    ).not.toThrow();
  });

  it('does not treat another company’s grant as this curator’s unlock (hop isolation)', () => {
    // A granted B; C presents empty relistGrantedIds — still RELIST_NOT_ALLOWED.
    expectBadRequest(
      () =>
        assertProductsCuratable({
          curatorCompanyId: 'buyer-c',
          products: [{ ...base, allowForward: false, companyId: 'supplier-a' }],
          discoverableIds: new Set(['p1']),
          relistGrantedIds: new Set(),
        }),
      'RELIST_NOT_ALLOWED',
    );
  });

  it('allows look-only when Everyone + allowForward', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [base],
        lookOnlyOwnerIds: new Set(['other']),
      }),
    ).not.toThrow();
  });

  it('rejects look-only on Followers packs even when Connected-style look set', () => {
    expectBadRequest(
      () =>
        assertProductsCuratable({
          curatorCompanyId: 'me',
          products: [{ ...base, audience: 'followers' }],
          lookOnlyOwnerIds: new Set(['other']),
        }),
      'FOLLOW_LOOK_ONLY',
    );
  });

  it('allows look-only Followers members when source pack is Everyone', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [{ ...base, audience: 'followers' }],
        lookOnlyOwnerIds: new Set(['other']),
        sourcePackAudience: 'everyone',
      }),
    ).not.toThrow();
  });

  it('rejects locked forward on foreign product', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [{ ...base, allowForward: false }],
      }),
    ).toThrow(/allow/i);
    expectBadRequest(
      () =>
        assertProductsCuratable({
          curatorCompanyId: 'me',
          products: [{ ...base, allowForward: false }],
        }),
      'RELIST_NOT_ALLOWED',
    );
  });

  it('allows own-company products without forward check', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [{ ...base, companyId: 'me', allowForward: false }],
      }),
    ).not.toThrow();
  });

  it('rejects everyone publish when a foreign member is connections-only', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        publishAudience: 'everyone',
        products: [{ ...base, audience: 'connections' }],
      }),
    ).toThrow(/audience/i);
    expectBadRequest(
      () =>
        assertProductsCuratable({
          curatorCompanyId: 'me',
          publishAudience: 'everyone',
          products: [{ ...base, audience: 'connections' }],
        }),
      'CURATED_AUDIENCE_TOO_WIDE',
    );
  });

  it('ignores own-company audience when checking publish ceiling', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        publishAudience: 'everyone',
        products: [
          { ...base, audience: 'connections' },
          { ...base, id: 'p2', companyId: 'me', audience: 'selected', allowForward: false },
        ],
      }),
    ).toThrow(/audience/i);
  });

  it('allows publish audience within foreign ceiling', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        publishAudience: 'connections',
        products: [{ ...base, audience: 'everyone' }],
      }),
    ).not.toThrow();
  });

  it('rejects foreign product not in discoverableIds', () => {
    expectBadRequest(
      () =>
        assertProductsCuratable({
          curatorCompanyId: 'me',
          discoverableIds: new Set<string>(),
          products: [base],
        }),
      'NOT_DISCOVERABLE',
    );
  });

  it('allows foreign product listed in discoverableIds', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        discoverableIds: new Set(['p1']),
        products: [base],
      }),
    ).not.toThrow();
  });

  it('skips discoverableIds check for own-company products', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        discoverableIds: new Set<string>(),
        products: [{ ...base, companyId: 'me', allowForward: false }],
      }),
    ).not.toThrow();
  });

  it('skipAddEligibility skips Pack/Look re-check but keeps audience ceiling', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'me',
        products: [{ ...base, audience: 'followers', allowForward: false }],
        lookOnlyOwnerIds: new Set(['other']),
        discoverableIds: new Set(),
        relistGrantedIds: new Set(),
        skipAddEligibility: true,
        publishAudience: 'followers',
      }),
    ).not.toThrow();

    expectBadRequest(
      () =>
        assertProductsCuratable({
          curatorCompanyId: 'me',
          products: [{ ...base, audience: 'followers', allowForward: false }],
          lookOnlyOwnerIds: new Set(['other']),
          skipAddEligibility: true,
          publishAudience: 'everyone',
        }),
      'CURATED_AUDIENCE_TOO_WIDE',
    );
  });
});

describe('curatedPublishAllowDownload', () => {
  it('allows own-only packs when requested', () => {
    expect(
      curatedPublishAllowDownload({
        curatorCompanyId: 'me',
        requested: true,
        products: [{ companyId: 'me', allowDownload: false }],
      }),
    ).toBe(true);
  });

  it('blocks when any foreign member has download off', () => {
    expect(
      curatedPublishAllowDownload({
        curatorCompanyId: 'me',
        requested: true,
        products: [
          { companyId: 'mill', allowDownload: false },
          { companyId: 'mill-2', allowDownload: true },
        ],
      }),
    ).toBe(false);
  });

  it('blocks when source pack download is off', () => {
    expect(
      curatedPublishAllowDownload({
        curatorCompanyId: 'me',
        requested: true,
        products: [{ companyId: 'mill', allowDownload: true }],
        sourcePackAllowDownload: false,
      }),
    ).toBe(false);
  });

  it('allows when every foreign member and source pack allow', () => {
    expect(
      curatedPublishAllowDownload({
        curatorCompanyId: 'me',
        requested: true,
        products: [{ companyId: 'mill', allowDownload: true }],
        sourcePackAllowDownload: true,
      }),
    ).toBe(true);
  });
});

describe('curatedPublishAllowForward', () => {
  it('honors requested off', () => {
    expect(
      curatedPublishAllowForward({
        requested: false,
        sourcePackAllowForward: true,
      }),
    ).toBe(false);
  });

  it('blocks when source pack forward is off', () => {
    expect(
      curatedPublishAllowForward({
        requested: true,
        sourcePackAllowForward: false,
      }),
    ).toBe(false);
  });

  it('allows when source pack allows or is unknown', () => {
    expect(
      curatedPublishAllowForward({
        requested: true,
        sourcePackAllowForward: true,
      }),
    ).toBe(true);
    expect(curatedPublishAllowForward({ requested: true })).toBe(true);
  });
});

describe('curatedPublishRateVisibility', () => {
  it('keeps requested visibility for own-only packs', () => {
    expect(
      curatedPublishRateVisibility({
        curatorCompanyId: 'me',
        requested: 'visible',
        products: [{ companyId: 'me', rateVisibility: 'on_request' }],
      }),
    ).toBe('visible');
  });

  it('forces on_request when any foreign source is on_request (no calc mode)', () => {
    expect(
      curatedPublishRateVisibility({
        curatorCompanyId: 'me',
        requested: 'visible',
        products: [
          { companyId: 'other', rateVisibility: 'on_request' },
          { companyId: 'other-2', rateVisibility: 'visible' },
        ],
      }),
    ).toBe('on_request');
  });

  it('allows visible when every foreign source allows visible rates', () => {
    expect(
      curatedPublishRateVisibility({
        curatorCompanyId: 'me',
        requested: 'visible',
        products: [
          { companyId: 'other', rateVisibility: 'visible' },
          { companyId: 'me', rateVisibility: 'on_request' },
        ],
      }),
    ).toBe('visible');
  });

  it('treats missing foreign rateVisibility as on_request', () => {
    expect(
      curatedPublishRateVisibility({
        curatorCompanyId: 'me',
        requested: 'visible',
        products: [{ companyId: 'other' }],
      }),
    ).toBe('on_request');
  });

  it('honors trader Visible when calc mode is set despite foreign on_request', () => {
    expect(
      curatedPublishRateVisibility({
        curatorCompanyId: 'me',
        requested: 'visible',
        calcPricingMode: 'edit',
        products: [{ companyId: 'other', rateVisibility: 'on_request' }],
      }),
    ).toBe('visible');
  });

  it('honors trader On request when calc mode is set', () => {
    expect(
      curatedPublishRateVisibility({
        curatorCompanyId: 'me',
        requested: 'on_request',
        calcPricingMode: 'margin_fixed',
        products: [{ companyId: 'other', rateVisibility: 'visible' }],
      }),
    ).toBe('on_request');
  });
});
