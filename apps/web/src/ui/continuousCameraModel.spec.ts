import { describe, expect, it } from 'vitest';
import {
  continuousCameraCanShoot,
  continuousCameraDoneEnabled,
  continuousCameraDoneLabel,
} from './continuousCameraModel';

describe('continuousCameraModel', () => {
  it('disables Done until at least one shot in this session', () => {
    expect(continuousCameraDoneEnabled(0)).toBe(false);
    expect(continuousCameraDoneEnabled(1)).toBe(true);
  });

  it('labels Done as Add N designs for new-design batches', () => {
    expect(continuousCameraDoneLabel(0, true)).toBe('Add design');
    expect(continuousCameraDoneLabel(1, true)).toBe('Add design');
    expect(continuousCameraDoneLabel(3, true)).toBe('Add 3 designs');
    expect(continuousCameraDoneLabel(2, false)).toBe('Done');
  });

  it('disables shutter until camera is ready with remaining slots', () => {
    expect(
      continuousCameraCanShoot({
        ready: false,
        busy: false,
        maxShots: 10,
        shotsTaken: 0,
      }),
    ).toBe(false);
    expect(
      continuousCameraCanShoot({
        ready: true,
        busy: false,
        maxShots: 10,
        shotsTaken: 0,
      }),
    ).toBe(true);
    expect(
      continuousCameraCanShoot({
        ready: true,
        busy: false,
        maxShots: 3,
        shotsTaken: 3,
      }),
    ).toBe(false);
  });
});
