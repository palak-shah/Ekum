import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { audienceRank, assertProductsCuratable } from './curation-ceiling';

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
      'FORWARD_NOT_ALLOWED',
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
});
