import { describe, expect, it } from 'vitest';
import { placeFlyoutBeside } from './placeFlyoutBeside';

describe('placeFlyoutBeside', () => {
  const flyout = { width: 140, height: 132 };

  it('prefers the left of the host when there is room', () => {
    expect(
      placeFlyoutBeside(
        { top: 80, left: 200, right: 360, bottom: 280 },
        { width: 390, height: 720 },
        flyout,
      ),
    ).toEqual({ top: 80, left: 54 });
  });

  it('uses the right when the left does not fit', () => {
    expect(
      placeFlyoutBeside(
        { top: 80, left: 8, right: 168, bottom: 280 },
        { width: 390, height: 720 },
        flyout,
      ),
    ).toEqual({ top: 80, left: 174 });
  });

  it('drops below when neither side fits', () => {
    expect(
      placeFlyoutBeside(
        { top: 80, left: 8, right: 380, bottom: 200 },
        { width: 390, height: 720 },
        flyout,
      ),
    ).toEqual({ top: 206, left: 8 });
  });
});
