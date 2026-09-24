import { describe, expect, it } from 'vitest';
import { shouldShowSelectionWorkspaceBar } from './selectionWorkspaceBarVisibility';

describe('shouldShowSelectionWorkspaceBar', () => {
  it('hides when empty', () => {
    expect(shouldShowSelectionWorkspaceBar('/explore', 0)).toBe(false);
  });

  it('shows on Explore, idle company, and chats list when count > 0', () => {
    expect(shouldShowSelectionWorkspaceBar('/explore', 2)).toBe(true);
    expect(shouldShowSelectionWorkspaceBar('/company/abc', 1)).toBe(true);
    expect(shouldShowSelectionWorkspaceBar('/chats', 3)).toBe(true);
  });

  it('hides on a company shop while that shop’s trade dock is up', () => {
    expect(shouldShowSelectionWorkspaceBar('/company/abc', 4, { shopDockUp: true })).toBe(false);
  });

  it('hides on open chat thread (composer)', () => {
    expect(shouldShowSelectionWorkspaceBar('/chats/thread-1', 3)).toBe(false);
  });

  it('hides on selection home and My Catalog root', () => {
    expect(shouldShowSelectionWorkspaceBar('/selection', 2)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/catalog', 2)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/more', 2)).toBe(false);
  });
});
