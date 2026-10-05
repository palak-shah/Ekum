import { describe, expect, it } from 'vitest';
import type { OrderShipmentView } from '@ekum/domain-types';
import {
  latestShipmentForLine,
  remainingAfterShipped,
  sellerCanFulfillEdit,
  sellerCanNewDispatch,
} from './lineFulfillCard';

describe('lineFulfillCard', () => {
  it('recalculates remaining when shipped changes', () => {
    expect(remainingAfterShipped(20, 15)).toBe(5);
    expect(remainingAfterShipped(20, 25)).toBe(0);
    expect(remainingAfterShipped(20, 0)).toBe(20);
  });

  it('allows seller fulfill edit on confirmed / part shipped / dispatched', () => {
    expect(sellerCanFulfillEdit({ direction: 'selling', status: 'confirmed' })).toBe(true);
    expect(sellerCanFulfillEdit({ direction: 'selling', status: 'dispatched' })).toBe(true);
    expect(sellerCanFulfillEdit({ direction: 'selling', status: 'settled' })).toBe(false);
    expect(sellerCanFulfillEdit({ direction: 'buying', status: 'confirmed' })).toBe(false);
  });

  it('allows new Dispatch only while confirmed / part shipped', () => {
    expect(sellerCanNewDispatch({ direction: 'selling', status: 'confirmed' })).toBe(true);
    expect(sellerCanNewDispatch({ direction: 'selling', status: 'part_shipped' })).toBe(true);
    expect(sellerCanNewDispatch({ direction: 'selling', status: 'dispatched' })).toBe(false);
    expect(sellerCanNewDispatch({ direction: 'selling', status: 'settled' })).toBe(false);
  });

  it('picks the newest shipment that includes the line', () => {
    const older = {
      id: 's1',
      items: [{ orderItemId: 'oi1', name: 'A', quantity: 10 }],
    } as OrderShipmentView;
    const newer = {
      id: 's2',
      items: [{ orderItemId: 'oi1', name: 'A', quantity: 5 }],
    } as OrderShipmentView;
    expect(latestShipmentForLine([newer, older], 'oi1')?.id).toBe('s2');
    expect(latestShipmentForLine([older], 'oi2')).toBeNull();
  });
});
