import { describe, expect, it } from 'vitest';
import { shouldShowSelectionWorkspaceBar } from './selectionWorkspaceBarVisibility';

describe('shouldShowSelectionWorkspaceBar', () => {
  it('hides when empty', () => {
    expect(shouldShowSelectionWorkspaceBar('/explore', 0)).toBe(false);
  });

  it('shows on Explore when count > 0', () => {
    expect(shouldShowSelectionWorkspaceBar('/explore', 2)).toBe(true);
  });

  it('shows on a shared design set when count > 0', () => {
    expect(shouldShowSelectionWorkspaceBar('/designs/set', 2)).toBe(true);
    expect(shouldShowSelectionWorkspaceBar('/designs/set', 0)).toBe(false);
  });

  it('shows on another shop only when that shop’s trade dock is down', () => {
    expect(shouldShowSelectionWorkspaceBar('/company/abc', 1)).toBe(true);
    expect(shouldShowSelectionWorkspaceBar('/company/abc', 4, { shopDockUp: true })).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/company/abc', 2, { ownShop: true })).toBe(false);
  });

  it('shows on a pack or design only while Selecting', () => {
    expect(shouldShowSelectionWorkspaceBar('/collections/seed-col-1', 2)).toBe(false);
    expect(
      shouldShowSelectionWorkspaceBar('/collections/seed-col-1', 2, { pageSelecting: true }),
    ).toBe(true);
    expect(shouldShowSelectionWorkspaceBar('/explore/products/seed-prod-1', 2)).toBe(false);
    expect(
      shouldShowSelectionWorkspaceBar('/explore/products/seed-prod-1', 2, { pageSelecting: true }),
    ).toBe(true);
    expect(
      shouldShowSelectionWorkspaceBar('/explore/products/seed-prod-1', 2, {
        pageSelecting: true,
        pageDockUp: true,
      }),
    ).toBe(false);
  });

  it('hides on Home, Chats, Orders, You, Settings, Network', () => {
    expect(shouldShowSelectionWorkspaceBar('/', 3)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/chats', 3)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/chats/thread-1', 3)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/orders', 4)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/orders/cm-order-1', 4)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/more', 2)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/settings', 2)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/settings/profile', 2)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/network', 2)).toBe(false);
    expect(shouldShowSelectionWorkspaceBar('/selection', 2)).toBe(false);
  });
});
