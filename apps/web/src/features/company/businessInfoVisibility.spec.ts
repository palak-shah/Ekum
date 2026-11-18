import { describe, expect, it } from 'vitest';
import {
  normalizePersonName,
  sameLabelSet,
  shareableGstLabel,
  showBusinessInfoCategories,
  showBusinessInfoCity,
  showBusinessInfoSells,
  showContactsCard,
  showTeamCard,
} from './businessInfoVisibility';

describe('businessInfoVisibility', () => {
  it('hides city when hero already shows the same city', () => {
    expect(showBusinessInfoCity('Surat', 'Surat')).toBe(false);
    expect(showBusinessInfoCity('Surat', 'surat')).toBe(false);
    expect(showBusinessInfoCity('Jaipur', 'Surat')).toBe(true);
    expect(showBusinessInfoCity('Surat', null)).toBe(true);
    expect(showBusinessInfoCity('', 'Surat')).toBe(false);
  });

  it('compares category label sets order-insensitively', () => {
    expect(sameLabelSet(['Sarees', 'Salwar'], ['Salwar', 'Sarees'])).toBe(true);
    expect(sameLabelSet(['Sarees'], ['Sarees', 'Fabric'])).toBe(false);
  });

  it('hides categories and sells when they match hero sell set', () => {
    expect(showBusinessInfoCategories(['sarees', 'salwar'], ['sarees', 'salwar'])).toBe(
      false,
    );
    expect(showBusinessInfoCategories(['fabric'], ['sarees'])).toBe(true);
    expect(showBusinessInfoSells(['sarees'], ['sarees'])).toBe(false);
    expect(showBusinessInfoSells(['fabric'], ['sarees'])).toBe(true);
    expect(showBusinessInfoSells([], ['sarees'])).toBe(false);
  });

  it('shareable GST only — no GST not shared', () => {
    expect(
      shareableGstLabel({
        isOwn: true,
        gstNumber: '24ABCDE1234F1Z5',
        verification: 'unverified',
      }),
    ).toBe('24ABCDE1234F1Z5');
    expect(
      shareableGstLabel({ isOwn: true, gstNumber: null, verification: 'unverified' }),
    ).toBeNull();
    expect(
      shareableGstLabel({
        isOwn: false,
        gstNumber: '24ABCDE1234F1Z5',
        verification: 'gst_verified',
      }),
    ).toBe('GST verified');
    expect(
      shareableGstLabel({
        isOwn: false,
        gstNumber: null,
        verification: 'unverified',
      }),
    ).toBeNull();
  });

  it('hides empty Contacts and Team; same single person → Contacts only', () => {
    expect(showContactsCard(true, [])).toBe(false);
    expect(
      showContactsCard(true, [{ name: 'Ravi', role: 'Sales', phone: '+91' }]),
    ).toBe(true);

    expect(
      showTeamCard({
        showTeamLink: true,
        teamMembers: [],
        showContacts: true,
        contacts: [{ name: 'Ravi', role: null, phone: null }],
      }),
    ).toBe(false);

    expect(
      showTeamCard({
        showTeamLink: true,
        teamMembers: [
          {
            userId: 'u1',
            name: 'Ravi',
            phoneMasked: '',
            role: 'owner',
            permissions: {
              uploads: true,
              chats: true,
              orders: true,
              payments: true,
              team: true,
            },
            contactRole: null,
          },
        ],
        showContacts: true,
        contacts: [{ name: 'Ravi', role: 'Owner', phone: '+91' }],
      }),
    ).toBe(false);

    expect(
      showTeamCard({
        showTeamLink: true,
        teamMembers: [
          {
            userId: 'u1',
            name: 'Ravi',
            phoneMasked: '',
            role: 'owner',
            permissions: {
              uploads: true,
              chats: true,
              orders: true,
              payments: true,
              team: true,
            },
            contactRole: null,
          },
          {
            userId: 'u2',
            name: 'Amit',
            phoneMasked: '',
            role: 'staff',
            permissions: {
              uploads: true,
              chats: true,
              orders: true,
              payments: false,
              team: false,
            },
            contactRole: null,
          },
        ],
        showContacts: true,
        contacts: [{ name: 'Ravi', role: 'Sales', phone: '+91' }],
      }),
    ).toBe(true);

    expect(normalizePersonName('  Ravi ')).toBe('ravi');
  });
});
