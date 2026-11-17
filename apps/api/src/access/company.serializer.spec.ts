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
    name: 'Surat Silk House',
    city: 'Surat',
    about: null,
    logoUrl: null,
    coverUrl: null,
    showcaseUrls: [],
    profileVisibility: 'public',
    contactPhone: null,
    showContactPhone: false,
    gstNumber: '24ABCDE1234F1Z5',
    verification: 'gst_verified',
    sellCategories: ['Sarees'],
    buyCategories: [],
    superCategories: ['womens_apparel'],
    masterCategories: [],
    canPublish: true,
    canRelist: false,
    canRefer: false,
  } as unknown as Company;

  it('never includes a phone field in public profile or summary', () => {
    const profile = serializer.toPublicProfile(company);
    const summary = serializer.toPublicSummary(company);
    expect(JSON.stringify(profile)).not.toMatch(/phone/i);
    expect(JSON.stringify(summary)).not.toMatch(/phone/i);
    expect(summary.sellCategories).toEqual(['Sarees']);
    expect(profile.profileAccess).toBe(true);
    expect(profile.showcaseUrls).toEqual([]);
  });

  it('returns a private stub without cover or showcase', () => {
    const profile = serializer.toPublicProfile(
      { ...company, profileVisibility: 'private', coverUrl: 'https://x/c.jpg' } as Company,
      { profileAccess: false },
    );
    expect(profile.profileAccess).toBe(false);
    expect(profile.coverUrl).toBeNull();
    expect(profile.showcaseUrls).toEqual([]);
    expect(profile.about).toBeNull();
    expect(profile.name).toBe('Surat Silk House');
    expect(profile.workingHours).toBeNull();
    expect(profile.shopAddress).toBeNull();
    expect(profile.websiteUrl).toBeNull();
  });

  it('emits hours, address and website on a full profile', () => {
    const profile = serializer.toPublicProfile({
      ...company,
      opensAt: '10:30',
      closesAt: '19:30',
      weeklyOff: 'sun',
      addressUnit: 'Shop 12',
      addressStreet: 'Ring Road',
      addressArea: 'Textile Market',
      addressPincode: '395002',
      websiteUrl: 'https://suratsilk.example/',
    } as Company);
    expect(profile.workingHours).toEqual({
      opensAt: '10:30',
      closesAt: '19:30',
      weeklyOff: 'sun',
    });
    expect(profile.shopAddress).toEqual({
      unit: 'Shop 12',
      street: 'Ring Road',
      area: 'Textile Market',
      pincode: '395002',
    });
    expect(profile.websiteUrl).toBe('https://suratsilk.example/');
  });

  it('lists company contact phone before team when opted in', () => {
    const points = serializer.toContactPoints(
      [membership({ showPhone: true, displayPhone: '+919822222222' })],
      {
        name: company.name,
        contactPhone: '+919800000099',
        showContactPhone: true,
      },
    );
    expect(points[0]).toMatchObject({
      kind: 'company',
      phone: '+919800000099',
    });
    expect(points[1]?.phone).toBe('+919822222222');
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
