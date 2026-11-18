import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { BusinessInfoSection, formatEkumSince } from './BusinessInfoSection';

afterEach(() => cleanup());

describe('formatEkumSince', () => {
  it('formats ISO date as month year', () => {
    const label = formatEkumSince('2026-09-15T00:00:00.000Z');
    expect(label).toBeTruthy();
    expect(label).toMatch(/2026/);
    expect(label!.toLowerCase()).toMatch(/sep/);
  });

  it('returns null for bad input', () => {
    expect(formatEkumSince(null)).toBeNull();
    expect(formatEkumSince('nope')).toBeNull();
  });
});

const base = {
  city: 'Surat',
  categories: ['Silk'],
  verification: 'gst_verified',
  isOwn: false,
  contacts: [] as { name: string; role: string | null; phone: string | null }[],
  showContacts: false,
  showTeamLink: false,
};

describe('BusinessInfoSection hours address website', () => {
  it('hides hours, address and website when they are empty', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection {...base} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Business info' }).className).toMatch(
      /text-name/,
    );
    expect(screen.getByRole('heading', { name: 'Business info' }).className).toMatch(/text-ink/);
    expect(screen.getByRole('heading', { name: 'Business info' }).className).not.toMatch(
      /text-muted|text-meta/,
    );
    expect(screen.queryByTestId('business-info-hours')).toBeNull();
    expect(screen.queryByTestId('business-info-address')).toBeNull();
    expect(screen.queryByTestId('business-info-map')).toBeNull();
    expect(screen.queryByTestId('business-info-website')).toBeNull();
  });

  it('shows hours caption, Map destination and website host', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          workingHours={{ opensAt: '10:30', closesAt: '19:30', weeklyOff: 'sun' }}
          shopAddress={{
            unit: 'Shop 12',
            street: 'Ring Road',
            area: 'Textile Market',
            pincode: '395002',
          }}
          websiteUrl="https://www.suratsilk.example/about"
          now={new Date('2026-11-16T05:00:00.000Z')}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('business-info-hours')).toHaveTextContent(
      'Open now · 10:30 AM – 7:30 PM · Sunday off',
    );
    expect(screen.getByTestId('business-info-map')).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search'),
    );
    expect(screen.getByTestId('business-info-website')).toHaveTextContent(
      'suratsilk.example',
    );
    expect(screen.getByRole('link', { name: 'suratsilk.example' })).toHaveAttribute(
      'target',
      '_blank',
    );
    await user.click(screen.getByTestId('business-info-hours'));
    expect(screen.getByTestId('business-info-hours-sheet')).toHaveTextContent(
      'Sunday · Off',
    );
  });
});

describe('BusinessInfoSection since last line', () => {
  it('puts On Ekum since in its own last bordered box with info icon', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          createdAt="2026-09-15T00:00:00.000Z"
          showContacts
          showTeamLink
          contacts={[{ name: 'Ravi', role: 'Sales', phone: '+91 98000 00001' }]}
          teamMembers={[
            {
              userId: 'u1',
              name: 'Ravi',
              phoneMasked: '98******01',
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
              phoneMasked: '97******02',
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
          ]}
        />
      </MemoryRouter>,
    );
    const section = screen.getByTestId('business-info');
    const since = screen.getByTestId('business-info-since');
    expect(since).toHaveTextContent(/On Ekum since/i);
    expect(since.className).toMatch(/rounded-xl border border-line/);
    // Own last sibling — not inside the Business info / Contacts / Team cards.
    expect(section.lastElementChild).toBe(since);
    expect(screen.getByTestId('business-info-gst').closest('[data-testid="business-info-since"]')).toBeNull();
    expect(screen.getByTestId('business-info-contacts').compareDocumentPosition(since)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByTestId('business-info-team').compareDocumentPosition(since)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});

describe('BusinessInfoSection hero dedupe and GST', () => {
  it('hides city and categories when they match the hero', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          heroCity="Surat"
          heroSellCategories={['Silk']}
          createdAt="2026-09-15T00:00:00.000Z"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('business-info-city')).toBeNull();
    expect(screen.queryByTestId('business-info-categories')).toBeNull();
    expect(screen.getByTestId('business-info-gst')).toHaveTextContent('GST verified');
  });

  it('shows city when it differs from the hero', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection {...base} city="Jaipur" heroCity="Surat" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('business-info-city')).toHaveTextContent('Jaipur');
  });

  it('labels category list as Sells', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          categories={['Silk', 'Fabric']}
          heroCity="Surat"
          heroSellCategories={['Sarees']}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('business-info-categories')).toHaveTextContent(
      /^Sells · /,
    );
    expect(screen.getByTestId('business-info-categories')).toHaveTextContent('Silk');
  });

  it('hides GST not shared for owner without GSTIN and unverified visitor', () => {
    const { rerender } = render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          isOwn
          verification="unverified"
          gstNumber={null}
          heroCity="Surat"
          heroSellCategories={['Silk']}
          createdAt="2026-09-15T00:00:00.000Z"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('business-info-gst')).toBeNull();
    expect(screen.queryByText(/GST not shared/i)).toBeNull();

    rerender(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          isOwn={false}
          verification="unverified"
          heroCity="Surat"
          heroSellCategories={['Silk']}
          createdAt="2026-09-15T00:00:00.000Z"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('business-info-gst')).toBeNull();
  });

  it('shows owner GSTIN when shareable', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          isOwn
          gstNumber="24ABCDE1234F1Z5"
          heroCity="Surat"
          heroSellCategories={['Silk']}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('business-info-gst')).toHaveTextContent(
      'GST · 24ABCDE1234F1Z5',
    );
  });

  it('hides empty Contacts and Team cards', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          showContacts
          showTeamLink
          contacts={[]}
          teamMembers={[]}
          heroCity="Surat"
          heroSellCategories={['Silk']}
          createdAt="2026-09-15T00:00:00.000Z"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('business-info-contacts')).toBeNull();
    expect(screen.queryByTestId('business-info-team')).toBeNull();
  });

  it('same single Contact and Team person → Contacts only', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          showContacts
          showTeamLink
          contacts={[{ name: 'Ravi', role: 'Sales', phone: '+91 98000 00001' }]}
          teamMembers={[
            {
              userId: 'u1',
              name: 'Ravi',
              phoneMasked: '98******01',
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
          ]}
          heroCity="Surat"
          heroSellCategories={['Silk']}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('business-info-contacts')).toBeInTheDocument();
    expect(screen.queryByTestId('business-info-team')).toBeNull();
  });
});

describe('BusinessInfoSection contacts call', () => {
  it('shows tel: call icon beside a phone and omits it when phone is missing', () => {
    render(
      <MemoryRouter>
        <BusinessInfoSection
          {...base}
          showContacts
          contacts={[
            { name: 'Ravi', role: 'Sales', phone: '+91 98000 00001' },
            { name: 'Meena', role: 'Owner', phone: null },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('business-info-contact-call-0')).toHaveAttribute(
      'href',
      'tel:+919800000001',
    );
    expect(screen.getByTestId('business-info-contact-call-0')).toHaveAttribute(
      'aria-label',
      'Call',
    );
    expect(screen.getByTestId('business-info-contact-call-0').className).toMatch(
      /text-success/,
    );
    expect(screen.getByTestId('business-info-contact-call-0').className).toMatch(/h-8 w-8/);
    expect(screen.getByTestId('business-info-contact-call-0').className).not.toMatch(
      /h-12 w-12/,
    );
    expect(screen.queryByTestId('business-info-contact-call-1')).toBeNull();
  });
});

describe('BusinessInfoSection team', () => {
  it('lists members and opens Invite / Edit team', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <BusinessInfoSection
                {...base}
                showContacts
                showTeamLink
                canInviteTeam
                teamMembers={[
                  {
                    userId: 'u1',
                    name: 'Meena',
                    phoneMasked: '98******01',
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
                    name: 'Ravi',
                    phoneMasked: '97******02',
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
                ]}
              />
            }
          />
          <Route path="/team" element={<div data-testid="team-landed" />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('business-info-team')).toHaveTextContent('Meena');
    expect(screen.getByTestId('business-info-team')).toHaveTextContent('Ravi');
    expect(screen.getByTestId('business-info-team')).toHaveTextContent('Staff');
    expect(screen.queryByText('Team', { selector: 'a' })).toBeNull();
    await user.click(screen.getByTestId('business-info-team'));
    expect(screen.getByTestId('business-info-team-invite')).toBeInTheDocument();
    await user.click(screen.getByTestId('business-info-team-edit'));
    expect(screen.getByTestId('team-landed')).toBeInTheDocument();
  });
});
