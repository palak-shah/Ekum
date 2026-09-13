import { describe, expect, it } from 'vitest';
import { ConnectionStatus } from '@ekum/domain-types';
import {
  counterpartCompanyId,
  mergeConnectionStatuses,
  orderCompanyPair,
} from './connection-pair';

describe('orderCompanyPair', () => {
  it('orders ids lexicographically', () => {
    expect(orderCompanyPair('b', 'a')).toEqual({
      companyLowId: 'a',
      companyHighId: 'b',
    });
    expect(orderCompanyPair('a', 'b')).toEqual({
      companyLowId: 'a',
      companyHighId: 'b',
    });
  });

  it('rejects the same company twice', () => {
    expect(() => orderCompanyPair('a', 'a')).toThrow(/different/);
  });
});

describe('mergeConnectionStatuses', () => {
  it('prefers Blocked over Paused and Active', () => {
    expect(
      mergeConnectionStatuses(ConnectionStatus.Active, ConnectionStatus.Blocked),
    ).toBe(ConnectionStatus.Blocked);
    expect(
      mergeConnectionStatuses(ConnectionStatus.Paused, ConnectionStatus.Active),
    ).toBe(ConnectionStatus.Paused);
  });
});

describe('counterpartCompanyId', () => {
  it('returns the other id on the pair', () => {
    const pair = orderCompanyPair('meena', 'ravi');
    expect(counterpartCompanyId('meena', pair)).toBe('ravi');
    expect(counterpartCompanyId('ravi', pair)).toBe('meena');
  });
});
