import { describe, expect, it } from 'vitest';
import { RateVisibility } from '@ekum/domain-types';
import {
  applyGroupPublishOverride,
  mergeGroupsPublishPolicy,
  readCompanyPublishDefaults,
  unionGroupMembers,
} from './publishDefaults';

describe('publishDefaults', () => {
  it('reads company usual from tradeDefaults', () => {
    expect(
      readCompanyPublishDefaults({
        publishDefaults: {
          rateVisibility: RateVisibility.Visible,
          allowForward: false,
        },
      }),
    ).toEqual({
      rateVisibility: RateVisibility.Visible,
      allowForward: false,
    });
  });

  it('inherits null group fields from usual', () => {
    const usual = {
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
    };
    expect(
      applyGroupPublishOverride(usual, {
        defaultRateVisibility: RateVisibility.Visible,
        allowForward: null,
      }),
    ).toEqual({
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
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
    });
    expect(usedStrictestMerge).toBe(true);
  });

  it('does not flag strictest merge for a single group', () => {
    const usual = {
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
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
    });
    expect(usedStrictestMerge).toBe(false);
  });
});
