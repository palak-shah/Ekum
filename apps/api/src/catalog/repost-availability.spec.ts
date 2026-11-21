import { describe, expect, it } from 'vitest';
import { MembershipOrigin } from '@ekum/domain-types';
import {
  buyerShouldOmitRepostPack,
  filterSoftAvailableProducts,
  filterViewerEligibleMembers,
  isRepostMemberViewerUnavailable,
  isRepostPackSoftUnavailable,
  isRepostProductSoftUnavailable,
  upstreamChainSoftResult,
  walkUpstreamPackIds,
  type UpstreamPackRow,
} from './repost-availability';
import { projectEligibleCollectionMembers } from './load-upstream-packs';

function pack(
  id: string,
  over: Partial<UpstreamPackRow> = {},
): UpstreamPackRow {
  return {
    id,
    allowForward: true,
    status: 'published',
    repostSourceCollectionId: null,
    ...over,
  };
}

describe('repost soft-unavailable (P1/P2)', () => {
  it('root packs are never soft-unavailable via upstream walk', () => {
    expect(
      isRepostPackSoftUnavailable({ repostSourceCollectionId: null }, new Map()),
    ).toBe(false);
  });

  it('P1: upstream allowForward false makes every descendant unavailable', () => {
    const byId = new Map<string, UpstreamPackRow>([
      ['s1', pack('s1', { allowForward: false })],
      ['t1', pack('t1', { repostSourceCollectionId: 's1' })],
      ['b1', pack('b1', { repostSourceCollectionId: 't1' })],
      ['c1', pack('c1', { repostSourceCollectionId: 'b1' })],
      ['d1', pack('d1', { repostSourceCollectionId: 'c1' })],
      ['e1', pack('e1', { repostSourceCollectionId: 'd1' })],
    ]);
    // Five hops deep — still unavailable
    expect(
      isRepostPackSoftUnavailable({ repostSourceCollectionId: 'e1' }, byId),
    ).toBe(true);
    expect(
      isRepostPackSoftUnavailable({ repostSourceCollectionId: 't1' }, byId),
    ).toBe(true);
  });

  it('P1 restore: when upstream allowForward returns, descendants available', () => {
    const byId = new Map<string, UpstreamPackRow>([
      ['s1', pack('s1', { allowForward: true })],
      ['t1', pack('t1', { repostSourceCollectionId: 's1' })],
    ]);
    expect(
      isRepostPackSoftUnavailable({ repostSourceCollectionId: 't1' }, byId),
    ).toBe(false);
  });

  it('P1: unpublished upstream fails closed', () => {
    const byId = new Map<string, UpstreamPackRow>([
      ['s1', pack('s1', { status: 'draft' })],
      ['t1', pack('t1', { repostSourceCollectionId: 's1' })],
    ]);
    expect(
      isRepostPackSoftUnavailable({ repostSourceCollectionId: 't1' }, byId),
    ).toBe(true);
  });

  it('incomplete and cyclic lineage fail closed', () => {
    const incomplete = new Map<string, UpstreamPackRow>([
      ['t1', pack('t1', { repostSourceCollectionId: 'missing' })],
    ]);
    expect(
      isRepostPackSoftUnavailable({ repostSourceCollectionId: 't1' }, incomplete),
    ).toBe(true);

    const cyclic = new Map<string, UpstreamPackRow>([
      ['a', pack('a', { repostSourceCollectionId: 'b' })],
      ['b', pack('b', { repostSourceCollectionId: 'a' })],
    ]);
    const walk = walkUpstreamPackIds('a', cyclic);
    expect(walk.cyclic).toBe(true);
    expect(isRepostPackSoftUnavailable({ repostSourceCollectionId: 'a' }, cyclic)).toBe(
      true,
    );
  });

  it('mixed: synced soft when chain soft; local stays; excluded never eligible', () => {
    const mill = {
      id: 'mill-p',
      companyId: 'mill',
      allowForward: true,
      status: 'published',
    };
    const local = {
      id: 'own-p',
      companyId: 'trader',
      allowForward: true,
      status: 'published',
    };
    expect(
      isRepostMemberViewerUnavailable({
        packCompanyId: 'trader',
        membershipOrigin: MembershipOrigin.Synced,
        product: mill,
        upstreamChainSoft: true,
      }),
    ).toBe(true);
    expect(
      isRepostMemberViewerUnavailable({
        packCompanyId: 'trader',
        membershipOrigin: MembershipOrigin.Local,
        product: local,
        upstreamChainSoft: true,
      }),
    ).toBe(false);
    expect(
      isRepostMemberViewerUnavailable({
        packCompanyId: 'trader',
        membershipOrigin: MembershipOrigin.Local,
        excluded: true,
        product: local,
        upstreamChainSoft: true,
      }),
    ).toBe(true);
    // Re-added synced stays synced — not local-style when chain soft.
    expect(
      isRepostMemberViewerUnavailable({
        packCompanyId: 'trader',
        membershipOrigin: MembershipOrigin.Synced,
        product: mill,
        upstreamChainSoft: true,
      }),
    ).toBe(true);

    const eligible = filterViewerEligibleMembers(
      'trader',
      [
        { membershipOrigin: MembershipOrigin.Synced, product: mill },
        { membershipOrigin: MembershipOrigin.Local, product: local },
      ],
      true,
    );
    expect(eligible.map((r) => r.product.id)).toEqual(['own-p']);
  });

  it('honest chrome: projectEligibleCollectionMembers keeps only eligible ids', () => {
    const row = {
      companyId: 'trader',
      products: [
        { product: { id: 'synced' } },
        { product: { id: 'local' } },
      ],
      _count: { products: 2 },
    };
    const projected = projectEligibleCollectionMembers(
      row,
      'buyer',
      new Set(['local']),
    );
    expect(projected.products.map((p) => p.product.id)).toEqual(['local']);
    expect(projected._count.products).toBe(1);
    expect(
      projectEligibleCollectionMembers(row, 'trader', new Set(['local'])),
    ).toBe(row);
  });

  it('buyer omit: fail-closed always; chain soft only when zero eligible', () => {
    expect(
      buyerShouldOmitRepostPack({
        chain: { soft: true, failClosed: true },
        eligibleMemberCount: 2,
      }),
    ).toBe(true);
    expect(
      buyerShouldOmitRepostPack({
        chain: { soft: true, failClosed: false },
        eligibleMemberCount: 1,
      }),
    ).toBe(false);
    expect(
      buyerShouldOmitRepostPack({
        chain: { soft: true, failClosed: false },
        eligibleMemberCount: 0,
      }),
    ).toBe(true);
    expect(
      buyerShouldOmitRepostPack({
        chain: upstreamChainSoftResult(
          { repostSourceCollectionId: null },
          new Map(),
        ),
        eligibleMemberCount: 0,
      }),
    ).toBe(false);
  });

  it('P2: only the locked product is unavailable; own products stay', () => {
    expect(
      isRepostProductSoftUnavailable('trader', {
        id: 'p1',
        companyId: 'mill',
        allowForward: false,
        status: 'published',
      }),
    ).toBe(true);
    expect(
      isRepostProductSoftUnavailable('trader', {
        id: 'p2',
        companyId: 'mill',
        allowForward: true,
        status: 'published',
      }),
    ).toBe(false);
    expect(
      isRepostProductSoftUnavailable('trader', {
        id: 'own',
        companyId: 'trader',
        allowForward: false,
        status: 'published',
      }),
    ).toBe(false);

    const filtered = filterSoftAvailableProducts('trader', [
      {
        product: {
          id: 'locked',
          companyId: 'mill',
          allowForward: false,
          status: 'published',
        },
      },
      {
        product: {
          id: 'open',
          companyId: 'mill',
          allowForward: true,
          status: 'published',
        },
      },
    ]);
    expect(filtered.map((r) => r.product.id)).toEqual(['open']);
  });
});
