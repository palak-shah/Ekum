import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type {
  CompanyContactPoint,
  ShopAddress,
  ShopWorkingHours,
  TeamMemberView,
} from '@ekum/domain-types';
import {
  categoryDisplayLabel,
  formatShopAddress,
  shopHoursCaption,
  shopMapsSearchUrl,
  shopWeekHoursLines,
  websiteDisplayHost,
} from '@ekum/domain-types';
import { ClockIcon, GroupIcon, PencilIcon, PhoneIcon, PinIcon, UserIcon } from '@/ui/icons';
import { isGstVerified } from '@/ui/GstTick';
import { Sheet, cx } from '@/ui/kit';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { contactTelHref } from './contactTelHref';

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
  now?: Date;
}) {
  const navigate = useNavigate();
  const [hoursOpen, setHoursOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const catLabels = categories
    .map((slug) => categoryDisplayLabel(slug))
    .filter(Boolean);
  const sells =
    sellCategories && sellCategories.length > 0
      ? sellCategories.map((slug) => categoryDisplayLabel(slug)).filter(Boolean)
      : [];
  const buys =
    buyCategories && buyCategories.length > 0
      ? buyCategories.map((slug) => categoryDisplayLabel(slug)).filter(Boolean)
      : [];

  const gstLabel = isOwn
    ? gstNumber?.trim()
      ? gstNumber.trim()
      : 'GST not shared'
    : isGstVerified(verification)
      ? 'GST verified'
      : 'GST not shared';

  const since = formatEkumSince(createdAt);
  const hoursCaption = shopHoursCaption(workingHours ?? null, now);
  const addressLine = formatShopAddress(shopAddress ?? null, city);
  const mapsHref = addressLine ? shopMapsSearchUrl(addressLine) : null;
  const websiteHref = websiteUrl?.trim() || null;
  const websiteHost = websiteHref ? websiteDisplayHost(websiteHref) : null;

  return (
    <section className="flex flex-col gap-2" data-testid="business-info">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-3 py-2">
          <h2 className="text-meta font-emphasis tracking-wide text-ink">Business info</h2>
        </div>
        {hoursCaption && workingHours ? (
          <InfoRow
            icon={<ClockIcon width={16} height={16} aria-hidden />}
            testId="business-info-hours"
            onClick={() => setHoursOpen(true)}
          >
            {hoursCaption}
          </InfoRow>
        ) : null}
        {city?.trim() ? (
          <InfoRow
            icon={<PinIcon width={16} height={16} aria-hidden />}
            testId="business-info-city"
          >
            {city.trim()}
          </InfoRow>
        ) : null}
        {addressLine && mapsHref ? (
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
        {websiteHref && websiteHost ? (
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
        {catLabels.length > 0 ? (
          <InfoRow testId="business-info-categories">
            <span className="flex flex-col gap-0.5">
              {catLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </span>
          </InfoRow>
        ) : null}
        {sells.length > 0 || buys.length > 0 ? (
          <InfoRow testId="business-info-trade">
            <span className="flex flex-col gap-0.5">
              {sells.length > 0 ? <span>Sells · {sells.join(', ')}</span> : null}
              {buys.length > 0 ? <span>Buys · {buys.join(', ')}</span> : null}
            </span>
          </InfoRow>
        ) : null}
        <InfoRow testId="business-info-gst">
          <span className={cx(!isOwn && !isGstVerified(verification) && 'text-muted')}>
            {gstLabel}
          </span>
        </InfoRow>
      </div>

      {showContacts ? (
        <div
          className="overflow-hidden rounded-xl border border-line bg-surface"
          data-testid="business-info-contacts"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <GroupIcon width={16} height={16} className="text-accent" aria-hidden />
            <p className="text-meta font-emphasis tracking-wide text-ink">Contacts</p>
          </div>
          {contacts.length < 1 ? (
            <p className="px-3 py-2.5 text-sm text-muted">No shared contacts yet.</p>
          ) : (
            contacts.map((point, index) => {
              const telHref = point.phone ? contactTelHref(point.phone) : null;
              return (
              <div
                key={`${point.name}-${index}`}
                className="flex flex-col gap-0.5 border-b border-line px-3 py-2.5 last:border-b-0"
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
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-success hover:bg-success-soft"
                      >
                        <PhoneIcon width={18} height={18} aria-hidden />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
              );
            })
          )}
        </div>
      ) : null}

      {showTeamLink ? (
        <button
          type="button"
          data-testid="business-info-team"
          onClick={() => setTeamMenuOpen(true)}
          className="overflow-hidden rounded-xl border border-line bg-surface text-left"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <GroupIcon width={16} height={16} className="text-accent" aria-hidden />
            <p className="text-meta font-emphasis tracking-wide text-ink">Team</p>
          </div>
          {teamMembers && teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div
                key={member.userId}
                className="border-b border-line px-3 py-2.5 last:border-b-0"
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
            ))
          ) : (
            <p className="px-3 py-2.5 text-sm text-muted">Just you</p>
          )}
        </button>
      ) : null}

      {since ? (
        <p className="px-0.5 text-meta text-muted" data-testid="business-info-since">
          On Ekum since {since}
        </p>
      ) : null}

      {showTeamLink ? (
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
    'flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left last:border-b-0';
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
