import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  CompanyContactPoint,
  ShopAddress,
  ShopWorkingHours,
  TeamMemberView,
} from '@ekum/domain-types';
import {
  formatShopAddress,
  shopHoursCaption,
  shopMapsSearchUrl,
  shopWeekHoursLines,
  websiteDisplayHost,
} from '@ekum/domain-types';
import {
  ClockIcon,
  GroupIcon,
  InfoIcon,
  PencilIcon,
  PhoneIcon,
  PinIcon,
  UserIcon,
} from '@/ui/icons';
import { Sheet } from '@/ui/kit';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { contactTelHref } from './contactTelHref';
import {
  labelsFromSlugs,
  shareableGstLabel,
  showBusinessInfoCategories,
  showBusinessInfoCity,
  showBusinessInfoSells,
  showContactsCard,
  showTeamCard,
} from './businessInfoVisibility';

const sectionTitleClass = 'text-name font-emphasis tracking-tight text-ink';

export function formatEkumSince(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function BusinessInfoSection({
  city,
  categories,
  sellCategories,
  buyCategories,
  verification,
  gstNumber,
  isOwn,
  contacts,
  showContacts,
  createdAt,
  showTeamLink,
  teamMembers,
  canInviteTeam,
  workingHours,
  shopAddress,
  websiteUrl,
  /** City already on the hero identity line — omit duplicate city row. */
  heroCity = null,
  /** Sell slugs already on the hero category line — omit duplicate cats/Sells. */
  heroSellCategories = [],
  now = new Date(),
}: {
  city: string | null;
  categories: string[];
  sellCategories?: string[] | null;
  buyCategories?: string[] | null;
  verification: string;
  /** Own GSTIN when available; never shown to visitors. */
  gstNumber?: string | null;
  isOwn: boolean;
  contacts: CompanyContactPoint[];
  showContacts: boolean;
  createdAt?: string | null;
  showTeamLink: boolean;
  teamMembers?: TeamMemberView[] | null;
  canInviteTeam?: boolean;
  workingHours?: ShopWorkingHours | null;
  shopAddress?: ShopAddress | null;
  websiteUrl?: string | null;
  heroCity?: string | null;
  heroSellCategories?: string[];
  now?: Date;
}) {
  const navigate = useNavigate();
  const [hoursOpen, setHoursOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);

  const showCity = showBusinessInfoCity(city, heroCity);
  const showCategories = showBusinessInfoCategories(categories, heroSellCategories);
  const showSells = showBusinessInfoSells(sellCategories, heroSellCategories);
  const buys = labelsFromSlugs(buyCategories);
  const showBuys = buys.length > 0;
  const catLabels = showCategories ? labelsFromSlugs(categories) : [];
  const sells = showSells ? labelsFromSlugs(sellCategories) : [];

  const gstLabel = shareableGstLabel({ isOwn, gstNumber, verification });
  const since = formatEkumSince(createdAt);
  const hoursCaption = shopHoursCaption(workingHours ?? null, now);
  const showHours = Boolean(hoursCaption && workingHours);
  const addressLine = formatShopAddress(shopAddress ?? null, city);
  const mapsHref = addressLine ? shopMapsSearchUrl(addressLine) : null;
  const showAddress = Boolean(addressLine && mapsHref);
  const websiteHref = websiteUrl?.trim() || null;
  const websiteHost = websiteHref ? websiteDisplayHost(websiteHref) : null;
  const showWebsite = Boolean(websiteHref && websiteHost);

  const hasInfoRows =
    showHours ||
    showCity ||
    showAddress ||
    showWebsite ||
    showCategories ||
    showSells ||
    showBuys ||
    Boolean(gstLabel);

  const contactsVisible = showContactsCard(showContacts, contacts);
  const teamVisible = showTeamCard({
    showTeamLink,
    teamMembers,
    showContacts,
    contacts,
  });

  if (!hasInfoRows && !contactsVisible && !teamVisible && !since) {
    return null;
  }

  return (
    <section className="flex flex-col gap-1.5" data-testid="business-info">
      {hasInfoRows ? (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line px-3 py-2.5">
            <h2 className={sectionTitleClass}>Business info</h2>
          </div>
          {showHours && workingHours ? (
            <InfoRow
              icon={<ClockIcon width={16} height={16} aria-hidden />}
              testId="business-info-hours"
              onClick={() => setHoursOpen(true)}
            >
              {hoursCaption}
            </InfoRow>
          ) : null}
          {showCity ? (
            <InfoRow
              icon={<PinIcon width={16} height={16} aria-hidden />}
              testId="business-info-city"
            >
              {city!.trim()}
            </InfoRow>
          ) : null}
          {showAddress && mapsHref ? (
            <InfoRow
              testId="business-info-address"
              trailing={
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="business-info-map"
                  className="shrink-0 text-meta font-emphasis text-accent"
                >
                  Map
                </a>
              }
            >
              {addressLine}
            </InfoRow>
          ) : null}
          {showWebsite && websiteHref && websiteHost ? (
            <InfoRow testId="business-info-website">
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-emphasis text-accent"
              >
                {websiteHost}
              </a>
            </InfoRow>
          ) : null}
          {showCategories ? (
            <InfoRow testId="business-info-categories">
              <span className="flex flex-col gap-1">
                <span>Sells · {catLabels.join(', ')}</span>
              </span>
            </InfoRow>
          ) : null}
          {showSells || showBuys ? (
            <InfoRow testId="business-info-trade">
              <span className="flex flex-col gap-1">
                {showSells ? <span>Sells · {sells.join(', ')}</span> : null}
                {showBuys ? <span>Buys · {buys.join(', ')}</span> : null}
              </span>
            </InfoRow>
          ) : null}
          {gstLabel ? (
            <InfoRow testId="business-info-gst">
              <span>
                {isOwn ? `GST · ${gstLabel}` : gstLabel}
              </span>
            </InfoRow>
          ) : null}
        </div>
      ) : null}

      {contactsVisible ? (
        <div
          className="overflow-hidden rounded-xl border border-line bg-surface"
          data-testid="business-info-contacts"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <GroupIcon width={16} height={16} className="text-accent" aria-hidden />
            <p className={sectionTitleClass}>Contacts</p>
          </div>
          {contacts.map((point, index) => {
            const telHref = point.phone ? contactTelHref(point.phone) : null;
            return (
              <div
                key={`${point.name}-${index}`}
                className="flex flex-col gap-1 border-b border-line px-3 py-3 last:border-b-0"
                data-testid={`business-info-contact-${index}`}
              >
                <p className="text-sm text-ink">
                  <span className="font-emphasis">{point.name}</span>
                  {point.role ? (
                    <span className="text-muted"> · {point.role}</span>
                  ) : null}
                </p>
                {point.phone ? (
                  <div className="flex items-center gap-1">
                    <p className="min-w-0 flex-1 text-sm font-emphasis text-accent">
                      {point.phone}
                    </p>
                    {telHref ? (
                      <a
                        href={telHref}
                        aria-label="Call"
                        data-testid={`business-info-contact-call-${index}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-success hover:bg-success-soft"
                      >
                        <PhoneIcon width={16} height={16} aria-hidden />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {teamVisible ? (
        <button
          type="button"
          data-testid="business-info-team"
          onClick={() => setTeamMenuOpen(true)}
          className="overflow-hidden rounded-xl border border-line bg-surface text-left"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <GroupIcon width={16} height={16} className="text-accent" aria-hidden />
            <p className={sectionTitleClass}>Team</p>
          </div>
          {(teamMembers ?? []).map((member) => (
            <div
              key={member.userId}
              className="border-b border-line px-3 py-3 last:border-b-0"
              data-testid={`business-info-team-${member.userId}`}
            >
              <p className="text-sm text-ink">
                <span className="font-emphasis">{member.name}</span>
                <span className="text-muted">
                  {' '}
                  · {member.role === 'owner' ? 'Owner' : 'Staff'}
                </span>
              </p>
            </div>
          ))}
        </button>
      ) : null}

      {teamVisible ? (
        <MoreActionsSheet
          open={teamMenuOpen}
          onClose={() => setTeamMenuOpen(false)}
          title="Team"
          testId="business-info-team-menu"
          items={[
            ...(canInviteTeam
              ? [
                  {
                    id: 'invite',
                    label: 'Invite',
                    icon: <UserIcon width={20} height={20} />,
                    testId: 'business-info-team-invite',
                    onClick: () => navigate('/team?invite=1'),
                  },
                ]
              : []),
            {
              id: 'edit',
              label: 'Edit team',
              icon: <PencilIcon width={20} height={20} />,
              testId: 'business-info-team-edit',
              onClick: () => navigate('/team'),
            },
          ]}
        />
      ) : null}

      {since ? (
        <div
          className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3"
          data-testid="business-info-since"
        >
          <InfoIcon width={16} height={16} className="shrink-0 text-slate" aria-hidden />
          <p className="text-sm text-muted">On Ekum since {since}</p>
        </div>
      ) : null}

      {workingHours ? (
        <Sheet
          open={hoursOpen}
          onClose={() => setHoursOpen(false)}
          title="Working hours"
        >
          <ul className="flex flex-col gap-2 pb-2" data-testid="business-info-hours-sheet">
            {shopWeekHoursLines(workingHours).map((row) => (
              <li key={row.weekday} className="text-sm text-ink">
                {row.line}
              </li>
            ))}
          </ul>
        </Sheet>
      ) : null}
    </section>
  );
}

function InfoRow({
  children,
  icon,
  testId,
  trailing,
  onClick,
}: {
  children: ReactNode;
  icon?: ReactNode;
  testId?: string;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const className =
    'flex w-full items-start gap-2.5 border-b border-line px-3 py-3 text-left last:border-b-0';
  const body = (
    <>
      {icon ? <span className="mt-0.5 shrink-0 text-accent">{icon}</span> : null}
      <div className="min-w-0 flex-1 text-sm text-ink">{children}</div>
      {trailing}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} data-testid={testId}>
        {body}
      </button>
    );
  }
  return (
    <div className={className} data-testid={testId}>
      {body}
    </div>
  );
}
