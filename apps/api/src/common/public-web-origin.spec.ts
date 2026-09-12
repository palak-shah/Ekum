import { describe, expect, it } from 'vitest';
import { resolvePublicWebOrigin } from './public-web-origin';

describe('resolvePublicWebOrigin', () => {
  it('prefers https over an earlier http IP origin', () => {
    expect(
      resolvePublicWebOrigin('http://74.225.252.243:8081,https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app');
  });

  it('uses the sole https origin', () => {
    expect(resolvePublicWebOrigin('https://beta.ekum.app')).toBe('https://beta.ekum.app');
  });

  it('falls back to http when that is all that is configured', () => {
    expect(resolvePublicWebOrigin('http://74.225.252.243:8081')).toBe(
      'http://74.225.252.243:8081',
    );
  });
});
