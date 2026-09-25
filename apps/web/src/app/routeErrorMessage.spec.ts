import { describe, expect, it } from 'vitest';
import { routeErrorDetail, routeErrorMessage } from './routeErrorMessage';

describe('routeErrorMessage', () => {
  it('maps 404 to a plain missing-page line', () => {
    expect(
      routeErrorMessage({
        status: 404,
        statusText: 'Not Found',
        data: 'Error',
        internal: true,
      }),
    ).toBe("This page isn't available.");
  });

  it('maps auth failures', () => {
    expect(
      routeErrorMessage({
        status: 403,
        statusText: 'Forbidden',
        data: null,
        internal: true,
      }),
    ).toBe("You don't have access here.");
  });

  it('falls back for unknown errors', () => {
    expect(routeErrorMessage(new Error('boom'))).toBe('Something went wrong. Try again.');
  });
});

describe('routeErrorDetail', () => {
  it('keeps the real crash line so they can send it (itemMeta / Saved)', () => {
    const error = new ReferenceError('itemMeta is not defined');
    error.stack = 'ReferenceError: itemMeta is not defined\n    at SavedFeedRow (SavedPage.tsx:564:48)';
    expect(routeErrorDetail(error)).toContain('itemMeta is not defined');
    expect(routeErrorDetail(error)).toContain('SavedFeedRow');
  });

  it('hides detail on a 404', () => {
    expect(
      routeErrorDetail({
        status: 404,
        statusText: 'Not Found',
        data: 'Error',
        internal: true,
      }),
    ).toBeNull();
  });
});
