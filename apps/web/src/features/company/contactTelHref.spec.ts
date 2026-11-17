import { describe, expect, it } from 'vitest';
import { contactTelHref } from './contactTelHref';

describe('contactTelHref', () => {
  it('builds tel: with + and digits only', () => {
    expect(contactTelHref('+91 98000 00001')).toBe('tel:+919800000001');
    expect(contactTelHref('+919800000001')).toBe('tel:+919800000001');
    expect(contactTelHref('98000-00001')).toBe('tel:9800000001');
  });

  it('returns null for empty or non-dialable', () => {
    expect(contactTelHref('')).toBeNull();
    expect(contactTelHref('   ')).toBeNull();
    expect(contactTelHref('+++')).toBeNull();
  });
});
