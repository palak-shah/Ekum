import { describe, expect, it } from 'vitest';
import { routeErrorMessage } from './routeErrorMessage';

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
