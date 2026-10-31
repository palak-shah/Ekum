import { describe, expect, it } from 'vitest';
import { threadLeaveDirty } from './threadLeaveDirty';

describe('threadLeaveDirty', () => {
  it('does not treat composer text or reply as leave-dirty', () => {
    expect(threadLeaveDirty({})).toBe(false);
  });

  it('still confirms attach, camera, upload, forward, and select pile', () => {
    expect(threadLeaveDirty({ attachSelected: true })).toBe(true);
    expect(threadLeaveDirty({ cameraOpen: true })).toBe(true);
    expect(threadLeaveDirty({ uploadingPhoto: true })).toBe(true);
    expect(threadLeaveDirty({ forwarding: true })).toBe(true);
    expect(threadLeaveDirty({ selectingWithPile: true })).toBe(true);
  });
});
