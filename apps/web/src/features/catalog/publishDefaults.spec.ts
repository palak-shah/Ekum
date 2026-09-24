import { describe, expect, it } from 'vitest';
import { RateVisibility } from '@ekum/domain-types';
import {
  applyGroupPublishOverride,
  mergeGroupsPublishPolicy,
  readCompanyPublishDefaults,
  readCompanySellAsUsual,
  readUnitConversions,
  unionGroupMembers,
} from './publishDefaults';

describe('publishDefaults', () => {
  it('reads company usual from tradeDefaults', () => {
    expect(
      readCompanyPublishDefaults({
        publishDefaults: {
          rateVisibility: RateVisibility.Visible,
          allowForward: false,
          allowDownload: true,
        },
      }),
    ).toEqual({
      rateVisibility: RateVisibility.Visible,
      allowForward: false,
      allowDownload: true,
    });
  });

  it('defaults allowDownload off', () => {
    expect(readCompanyPublishDefaults({})).toEqual({
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
      allowDownload: false,
    });
  });

  it('reads sellAsUsual without rate or notes', () => {
    expect(
      readCompanySellAsUsual({
        sellAsUsual: { unit: 'set', piecesPerPack: 6, rate: '800', notes: 'skip', moq: 12 },
      }),
    ).toEqual({
      unit: 'set',
      piecesPerPack: '6',
      moq: '12',
    });
  });

  it('reads unitConversions', () => {
    expect(
      readUnitConversions({
        unitConversions: [{ from: 'yard', to: 'mtr', factor: '0.914' }],
      }),
    ).toEqual([{ from: 'yard', to: 'mtr', factor: '0.914' }]);
  });

  it('inherits null group fields from usual', () => {
    const usual = {
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
      allowDownload: false,
    };
    expect(
      applyGroupPublishOverride(usual, {
        defaultRateVisibility: RateVisibility.Visible,
        allowForward: null,
      }),
    ).toEqual({
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
      allowDownload: false,
    });
  });

  it('unions group members uniquely', () => {
    expect(
      unionGroupMembers([
        { memberCompanyIds: ['a', 'b'] },
        { memberCompanyIds: ['b', 'c'] },
      ]),
    ).toEqual(['a', 'b', 'c']);
  });

  it('merges multiple groups with strictest wins', () => {
    const usual = {
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
      allowDownload: false,
    };
    const { policy, usedStrictestMerge } = mergeGroupsPublishPolicy(usual, [
      {
        memberCompanyIds: ['a'],
        defaultRateVisibility: RateVisibility.Visible,
        allowForward: true,
      },
      {
        memberCompanyIds: ['b'],
        defaultRateVisibility: RateVisibility.OnRequest,
        allowForward: false,
      },
    ]);
    expect(policy).toEqual({
      rateVisibility: RateVisibility.OnRequest,
      allowForward: false,
      allowDownload: false,
    });
    expect(usedStrictestMerge).toBe(true);
  });

  it('does not flag strictest merge for a single group', () => {
    const usual = {
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
      allowDownload: true,
    };
    const { policy, usedStrictestMerge } = mergeGroupsPublishPolicy(usual, [
      {
        memberCompanyIds: ['a'],
        defaultRateVisibility: RateVisibility.Visible,
        allowForward: false,
      },
    ]);
    expect(policy).toEqual({
      rateVisibility: RateVisibility.Visible,
      allowForward: false,
      allowDownload: true,
    });
    expect(usedStrictestMerge).toBe(false);
  });
});
