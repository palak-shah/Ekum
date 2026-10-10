import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  filterTransporterHistory,
  listTransporterHistory,
  readLastTransporter,
  rememberTransporter,
  transporterLastKey,
} from './transporterMemory';

describe('transporterMemory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('remembers MRU unique newest-first and caps', () => {
    rememberTransporter('VRL');
    rememberTransporter('TCI');
    rememberTransporter('vrl');
    expect(listTransporterHistory()[0]).toBe('vrl');
    expect(listTransporterHistory().filter((n) => n.toLowerCase() === 'vrl')).toHaveLength(1);
    expect(listTransporterHistory()).toEqual(['vrl', 'TCI']);
  });

  it('stores last-used per shop', () => {
    rememberTransporter('VRL', 'shop-a');
    rememberTransporter('TCI', 'shop-b');
    expect(readLastTransporter('shop-a')).toBe('VRL');
    expect(readLastTransporter('shop-b')).toBe('TCI');
    expect(localStorage.getItem(transporterLastKey('shop-a'))).toBe('VRL');
  });

  it('ignores blank remember', () => {
    rememberTransporter('  ');
    expect(listTransporterHistory()).toEqual([]);
  });

  it('filters history by query', () => {
    rememberTransporter('VRL Logistics');
    rememberTransporter('TCI Freight');
    rememberTransporter('Safe Express');
    expect(filterTransporterHistory('vr')).toEqual(['VRL Logistics']);
    expect(filterTransporterHistory('')).toEqual(['Safe Express', 'TCI Freight', 'VRL Logistics']);
  });
});
