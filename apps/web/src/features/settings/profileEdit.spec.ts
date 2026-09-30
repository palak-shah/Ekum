import { describe, expect, it } from 'vitest';
import { isOwnProfileEditing } from './profileEdit';

describe('isOwnProfileEditing', () => {
  it('is off on the default Profile page', () => {
    expect(isOwnProfileEditing('/settings/profile')).toBe(false);
    expect(isOwnProfileEditing('/settings/profile', '')).toBe(false);
    expect(isOwnProfileEditing('/more', '?edit=1')).toBe(false);
  });

  it('is on for Edit or Explore sell focus', () => {
    expect(isOwnProfileEditing('/settings/profile', '?edit=1')).toBe(true);
    expect(isOwnProfileEditing('/settings/profile', 'edit=1&focus=sell')).toBe(true);
    expect(isOwnProfileEditing('/settings/profile', '?focus=sell')).toBe(true);
  });
});
