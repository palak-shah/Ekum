import { describe, expect, it } from 'vitest';
import type { Company, CompanyMembership, User } from '@prisma/client';
import { CompanySerializer } from './company.serializer';

/**
 * Trust rule: contact protection. The login phone is never emitted, public views
 * carry no phone at all, and a contact point's phone appears only on explicit opt-in.
 */
describe('CompanySerializer contact protection', () => {
  const serializer = new CompanySerializer();
  const company = {
    id: 'c1',
    name: 'Ravi Textiles',
    city: 'Surat',
    about: null,
    logoUrl: null,
    gstNumber: '24ABCDE1234F1Z5',
    verification: 'gst_verified',
    sellCategories: ['Sarees'],
    buyCategories: [],
    superCategories: ['womens_apparel'],
    canPublish: true,
    canRelist: false,
    canRefer: false,
  } as unknown as Company;

  it('never includes a phone field in public profile or summary', () => {
    const profile = serializer.toPublicProfile(company);
    const summary = serializer.toPublicSummary(company);
    expect(JSON.stringify(profile)).not.toMatch(/phone/i);
    expect(JSON.stringify(summary)).not.toMatch(/phone/i);
  });

  const membership = (over: Partial<CompanyMembership>) =>
    ({
      contactRole: 'Sales',
      showPhone: false,
      displayPhone: '+919800000001',
      user: { name: 'Ravi', phone: '+919811111111' },
      ...over,
    }) as unknown as CompanyMembership & { user: Pick<User, 'name' | 'phone'> };

  it('hides the phone when the business has not opted in', () => {
    const [point] = serializer.toContactPoints([membership({ showPhone: false })]);
    expect(point.phone).toBeNull();
  });

  it('shows the display phone (never the login phone) when opted in', () => {
    const [point] = serializer.toContactPoints([
      membership({ showPhone: true, displayPhone: '+919822222222' }),
    ]);
    expect(point.phone).toBe('+919822222222');
    // The login phone must never surface, even when a display phone is shown.
    expect(point.phone).not.toBe('+919811111111');
  });

  it('drops memberships that are not tagged as contact points', () => {
    const points = serializer.toContactPoints([membership({ contactRole: null })]);
    expect(points).toHaveLength(0);
  });
});
