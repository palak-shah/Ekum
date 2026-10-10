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

  it('flips above a bottom bubble so the message menu stays on screen', () => {
    const pos = placeInboxRowMenu(
      { top: 640, bottom: 700, right: 340 },
      { width: 390, height: 780 },
      { width: 160, height: 280 },
    );
    expect(pos.top + 280).toBeLessThanOrEqual(780 - 8);
    expect(pos.top).toBeLessThan(640);
  });

  it('anchors to a small chevron box — not a tall trade-card bottom', () => {
    // Tall collection card: message bottom is far below the chevron.
    const chevron = { top: 120, bottom: 148, right: 360 };
    const pos = placeInboxRowMenu(chevron, { width: 390, height: 800 }, { width: 160, height: 280 });
    expect(pos.top).toBe(148 + 6);
    expect(pos.top).toBeLessThan(200);
  });
});
