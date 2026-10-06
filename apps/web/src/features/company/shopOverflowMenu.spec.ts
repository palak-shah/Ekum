import { describe, expect, it } from 'vitest';
import { findDirectThreadForCompany, shopOverflowItems } from './shopOverflowMenu';

describe('shopOverflowItems', () => {
  it('own shop is Share only', () => {
    expect(
      shopOverflowItems({
        isOwn: true,
        hasDirectThread: true,
        followPending: true,
        following: true,
      }),
    ).toEqual(['share']);
  });

  it('stranger: Share then Block', () => {
    expect(
      shopOverflowItems({
        isOwn: false,
        hasDirectThread: false,
        followPending: false,
        following: false,
      }),
    ).toEqual(['share', 'block']);
  });

  it('puts Mute after Share when 1:1 exists; Remove last when Has access', () => {
    expect(
      shopOverflowItems({
        isOwn: false,
        hasDirectThread: true,
        followPending: false,
        following: true,
      }),
    ).toEqual(['share', 'mute', 'block', 'remove']);
  });

  it('shows Remove when Requested', () => {
    expect(
      shopOverflowItems({
        isOwn: false,
        hasDirectThread: false,
        followPending: true,
        following: false,
      }),
    ).toEqual(['share', 'block', 'remove']);
  });
});

describe('findDirectThreadForCompany', () => {
  it('finds direct counterpart', () => {
    const threads = [
      { type: 'group', counterpart: { id: 'x' } },
      { type: 'direct', counterpart: { id: 'shop' } },
    ];
    expect(findDirectThreadForCompany(threads, 'shop')?.counterpart?.id).toBe('shop');
    expect(findDirectThreadForCompany(threads, 'other')).toBeUndefined();
  });
});
