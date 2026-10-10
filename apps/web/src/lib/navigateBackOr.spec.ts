import { describe, expect, it, vi } from 'vitest';
import { navigateBackOr } from './navigateBackOr';

/** BM: pasted order URL — Back must land on the list, not a dead navigate(-1). */
describe('navigateBackOr', () => {
  it('goes to the fallback when this is the first history entry (pasted URL)', () => {
    const navigate = vi.fn();
    navigateBackOr(navigate, 'default', '/orders');
    expect(navigate).toHaveBeenCalledWith('/orders');
    expect(navigate).not.toHaveBeenCalledWith(-1);
  });

  it('goes history-back when the trader arrived from another in-app screen', () => {
    const navigate = vi.fn();
    navigateBackOr(navigate, 'abc123', '/orders');
    expect(navigate).toHaveBeenCalledWith(-1);
    expect(navigate).not.toHaveBeenCalledWith('/orders');
  });
});
