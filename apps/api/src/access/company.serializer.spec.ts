import { describe, expect, it } from 'vitest';
import type { Company, CompanyMembership, User } from '@prisma/client';
import { CompanySerializer } from './company.serializer';

const serializer = new CompanySerializer();

const company = {
  id: 'company-1',
  name: 'Ravi Collections',
  city: 'Surat',
  about: 'Sarees and dress material',
  gstNumber: 'GST123',
  verification: 'gst_verified',
  canPublish: true,
  canRelist: false,
  canRefer: true,
  sellCategories: ['Sarees'],
  buyCategories: ['Fabric'],
} as unknown as Company;

describe('CompanySerializer', () => {
  it('never exposes GST or buy categories in the public profile', () => {
    const profile = serializer.toPublicProfile(company);
    expect(profile).not.toHaveProperty('gstNumber');
    expect(profile).not.toHaveProperty('buyCategories');
    expect(profile.categories).toEqual(['Sarees']);
  });

  it('maps capabilities into the owner profile', () => {
    const profile = serializer.toOwnProfile(company);
    expect(profile.capabilities).toEqual({ publish: true, relist: false, refer: true });
    expect(profile.gstNumber).toBe('GST123');
  });

  it('masks the display phone unless the business opts in', () => {
    const membership = (
      showPhone: boolean,
    ): CompanyMembership & { user: Pick<User, 'name' | 'phone'> } =>
      ({
        contactRole: 'Sales',
        showPhone,
        displayPhone: '+91 90000 00000',
        user: { name: 'Ravi Shah', phone: '+91 98888 88888' },
      }) as unknown as CompanyMembership & { user: Pick<User, 'name' | 'phone'> };

    const hidden = serializer.toContactPoints([membership(false)]);
    expect(hidden[0]?.phone).toBeNull();

    const shown = serializer.toContactPoints([membership(true)]);
    expect(shown[0]?.phone).toBe('+91 90000 00000');
  });

  it('omits memberships that are not contact points', () => {
    const membership = {
      contactRole: null,
      showPhone: false,
      displayPhone: null,
      user: { name: 'Staff', phone: '+91 90000 00000' },
    } as unknown as CompanyMembership & { user: Pick<User, 'name' | 'phone'> };
    expect(serializer.toContactPoints([membership])).toHaveLength(0);
  });
});
