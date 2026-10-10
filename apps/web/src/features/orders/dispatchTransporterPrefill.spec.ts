import { describe, expect, it } from 'vitest';
import { dispatchTransporterPrefill } from './dispatchTransporterPrefill';

describe('dispatchTransporterPrefill', () => {
  it('seeds trimmed order.transporter', () => {
    expect(dispatchTransporterPrefill('  VRL  ')).toBe('VRL');
  });

  it('leaves empty when unset', () => {
    expect(dispatchTransporterPrefill(null)).toBeUndefined();
    expect(dispatchTransporterPrefill('')).toBeUndefined();
    expect(dispatchTransporterPrefill('   ')).toBeUndefined();
  });
});
