import { placeInboxRowMenu } from './placeInboxRowMenu';

describe('placeInboxRowMenu', () => {
  it('opens below the row and stays on screen', () => {
    expect(
      placeInboxRowMenu(
        { top: 80, bottom: 140, right: 360 },
        { width: 390, height: 800 },
      ),
    ).toEqual({ top: 146, left: 160 });
  });

  it('flips above the row when the dock would clip', () => {
    const pos = placeInboxRowMenu(
      { top: 620, bottom: 680, right: 360 },
      { width: 390, height: 720 },
    );
    expect(pos.top).toBeLessThan(620);
    expect(pos.left).toBeGreaterThanOrEqual(8);
  });
});
