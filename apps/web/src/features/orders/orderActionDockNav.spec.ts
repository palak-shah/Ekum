import { describe, expect, it } from 'vitest';
import {
  getOrderActionDockNavVisible,
  setOrderActionDockNavVisible,
} from './orderActionDockNav';

describe('orderActionDockNav', () => {
  it('toggles visibility for the shell', () => {
    setOrderActionDockNavVisible(false);
    expect(getOrderActionDockNavVisible()).toBe(false);
    setOrderActionDockNavVisible(true);
    expect(getOrderActionDockNavVisible()).toBe(true);
    setOrderActionDockNavVisible(false);
    expect(getOrderActionDockNavVisible()).toBe(false);
  });
});
