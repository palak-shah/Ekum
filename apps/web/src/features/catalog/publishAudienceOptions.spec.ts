import { describe, expect, it } from 'vitest';
import { PublishAudience } from '@ekum/domain-types';
import {
  DEFAULT_PUBLISH_AUDIENCE,
  PUBLISH_WHO_OPTIONS,
  audienceForPublishSheet,
} from './publishAudienceOptions';

describe('publishAudienceOptions', () => {
  it('defaults to My followers', () => {
    expect(DEFAULT_PUBLISH_AUDIENCE).toBe(PublishAudience.Followers);
  });

  it('Who list excludes My connections', () => {
    const values = PUBLISH_WHO_OPTIONS.map(([value]) => value);
    expect(values).toEqual([
      PublishAudience.Everyone,
      PublishAudience.Followers,
      PublishAudience.Selected,
    ]);
    expect(values).not.toContain(PublishAudience.Connections);
  });

  it('maps legacy connections to Followers on the sheet', () => {
    expect(audienceForPublishSheet(PublishAudience.Connections)).toBe(
      PublishAudience.Followers,
    );
    expect(audienceForPublishSheet(undefined)).toBe(PublishAudience.Followers);
  });

  it('keeps Everyone / Followers / Selected when allowed', () => {
    expect(audienceForPublishSheet(PublishAudience.Everyone)).toBe(PublishAudience.Everyone);
    expect(audienceForPublishSheet(PublishAudience.Followers)).toBe(PublishAudience.Followers);
    expect(audienceForPublishSheet(PublishAudience.Selected)).toBe(PublishAudience.Selected);
  });

  it('when ceiling is Connections, sheet uses Selected instead of Followers', () => {
    expect(
      audienceForPublishSheet(PublishAudience.Followers, PublishAudience.Connections),
    ).toBe(PublishAudience.Selected);
    expect(
      audienceForPublishSheet(PublishAudience.Connections, PublishAudience.Connections),
    ).toBe(PublishAudience.Selected);
  });
});
