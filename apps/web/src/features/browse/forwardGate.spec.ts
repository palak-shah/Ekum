import { canPutInPack } from './forwardGate';

describe('canPutInPack', () => {
  it('allows when allowForward is true', () => {
    expect(canPutInPack(true, false)).toBe(true);
  });

  it('allows locked design when grant is present', () => {
    expect(canPutInPack(false, true)).toBe(true);
  });

  it('allows when source pack published allow-to-relist', () => {
    expect(canPutInPack(false, false, true)).toBe(true);
  });

  it('locks when neither forward nor grant nor pack open', () => {
    expect(canPutInPack(false, false, false)).toBe(false);
  });
});
