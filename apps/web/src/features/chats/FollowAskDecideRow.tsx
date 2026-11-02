import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, compactCta, cx } from '@/ui/kit';
import { SEE_PACKS_ASK_LINE, SHARE_PACKS_ASK_LINE, SHARE_PACKS_ASK_SUBLINE } from '@/features/company/seePacksCopy';
import {
  followAskAllowDecision,
  followAskGrantsForKind,
  FOLLOW_ASK_GRANT_OPTIONS,
  type FollowAskGrantId,
  type FollowAskGrants,
} from './followAskDecide';

export { compactCta };

/** Incoming ask: shop name + full-width why-line (never crush the sentence). */
export function FollowAskHeader({
  name,
  logoUrl,
  avatarSize = 40,
  to,
  className,
  kind = 'see',
}: {
  name: string;
  logoUrl?: string | null;
  avatarSize?: number;
  /** When set, the header is a shop link. */
  to?: string;
  className?: string;
  kind?: 'see' | 'share';
}) {
  const body = (
    <>
      <Avatar name={name} imageUrl={logoUrl} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-name font-emphasis leading-snug text-ink">{name}</p>
        <p className="text-sm font-emphasis leading-snug text-ink" data-testid="follow-ask-why">
          {kind === 'share' ? SHARE_PACKS_ASK_LINE : SEE_PACKS_ASK_LINE}
        </p>
        {kind === 'share' ? (
          <p className="text-sm leading-snug text-muted" data-testid="follow-ask-subline">
            {SHARE_PACKS_ASK_SUBLINE}
          </p>
        ) : null}
      </div>
    </>
  );
  const rowClass = cx('flex min-w-0 items-center gap-3', className);
  if (to) {
    return (
      <Link to={to} className={rowClass}>
        {body}
      </Link>
    );
  }
  return <div className={rowClass}>{body}</div>;
}

export function FollowGrantChecks({
  grants,
  disabled,
  locked,
  compact = false,
  testIdPrefix = 'follow-ask-grant',
  onToggle,
}: {
  grants: FollowAskGrants;
  disabled?: boolean;
  locked?: ReadonlyArray<FollowAskGrantId>;
  compact?: boolean;
  testIdPrefix?: string;
  onToggle: (id: FollowAskGrantId) => void;
}) {
  return (
    <div className={cx('flex', compact ? 'flex-wrap items-center gap-x-3 gap-y-0.5' : 'flex-col gap-1')}>
      {FOLLOW_ASK_GRANT_OPTIONS.map((option) => {
        const on = grants[option.id];
        const lock = locked?.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            role="checkbox"
            aria-label={option.label}
            aria-checked={on}
            aria-disabled={lock || disabled || undefined}
            disabled={disabled && !lock}
            data-testid={`${testIdPrefix}-${option.id}`}
            className={cx(
              'flex items-center text-left',
              compact ? 'min-h-6 gap-1.5' : 'min-h-7 gap-2',
              disabled && !lock && 'opacity-45',
            )}
            onClick={() => {
              if (lock || disabled) return;
              onToggle(option.id);
            }}
          >
            <span
              className={cx(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px]',
                on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface',
              )}
              aria-hidden
            >
              {on ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.2 4.8 8.5 9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            <span className="text-meta font-emphasis leading-snug text-ink">
              {compact ? option.shortLabel : option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FollowAskDecideRow({
  disabled,
  onAllow,
  onDecline,
  kind = 'see',
}: {
  disabled?: boolean;
  onAllow: (decision: 'look' | 'pack') => void;
  onDecline: () => void;
  kind?: 'see' | 'share';
}) {
  const [grants, setGrants] = useState<FollowAskGrants>(() => followAskGrantsForKind(kind));
  const decision = followAskAllowDecision(grants);

  return (
    <div className="flex flex-col gap-1.5">
      <FollowGrantChecks
        compact
        grants={grants}
        disabled={disabled}
        locked={kind === 'share' ? ['see'] : undefined}
        onToggle={(id) => setGrants((prev) => ({ ...prev, [id]: !prev[id] }))}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className={cx(compactCta, 'bg-accent text-on-accent')}
          disabled={disabled || !decision}
          onClick={() => decision && onAllow(decision)}
        >
          Allow
        </button>
        <button
          type="button"
          className={cx(compactCta, 'border-[1.5px] border-accent bg-surface text-accent')}
          disabled={disabled}
          onClick={onDecline}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
