import { describe, expect, it } from 'vitest';
import { armDiscardLeaveBypass } from './discardLeaveBypass';

describe('armDiscardLeaveBypass', () => {
  it('arms bypass so tryLeave → navigate does not open discard twice', () => {
    const bypassRef = { current: false };
    armDiscardLeaveBypass(bypassRef);
    expect(bypassRef.current).toBe(true);
  });
});
