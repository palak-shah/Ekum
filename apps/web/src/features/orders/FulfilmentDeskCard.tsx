import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { shortOrderLabel } from '@ekum/domain-types';
import { Avatar, Card, StatusPill, cx } from '@/ui/kit';
import { ChevronRightIcon } from '@/ui/icons';
import { tradeListStatusLabel } from '@/features/orders/tradeListProtocol';
import { millDeskCardClass } from '@/features/orders/iHandleDesk';

type FulfilmentDeskCardProps = {
  /** Mill shop name or “You”. */
  title: string;
  /** Quiet subtitle when header is not an open row (held / buyer). */
  subtitle?: string | null;
  /** Hop order id — used for open row / StatusPill. */
  hopOrderId?: string | null;
  /** When false, no navigate (buyer soft-hide). */
  hopLinked?: boolean;
  hopLinkTestId?: string;
  status?: string | null;
  dropped?: boolean;
  /** Foam wash for You identity (no mill avatar). */
  youIdentity?: boolean;
  /** Show StatusPill when hop is open (default true). Mill open rows use waitLabel instead. */
  showStatus?: boolean;
  /**
   * Quiet Orders-list open row: entire header links when hopLinked + hopOrderId.
   * Subline: Buying # (mill) or designs count (You).
   */
  openRow?: boolean;
  openSubtitle?: string | null;
  /**
   * Show Order # beside title on open row (You keeps it; mill omits — default true).
   */
  showTitleOrderId?: boolean;
  /**
   * Trailing muted wait on mill open row (rates / confirm / dispatch / Held).
   * Replaces StatusPill when set.
   */
  waitLabel?: string | null;
  headerTrailing?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
  className?: string;
};

/**
 * Shared shell for mill + You fulfilment cards on the I-handle Selling desk.
 * Operate for You/mill is navigate-to-hop only — never parent Confirm/Dispatch POSTs.
 */
export function FulfilmentDeskCard({
  title,
  subtitle,
  hopOrderId,
  hopLinked = true,
  hopLinkTestId,
  status,
  dropped = false,
  youIdentity = false,
  showStatus = true,
  openRow = false,
  openSubtitle,
  showTitleOrderId = true,
  waitLabel = null,
  headerTrailing,
  children,
  footer,
  testId,
  className,
}: FulfilmentDeskCardProps) {
  const hopOpen = Boolean(hopOrderId) && !dropped;
  const canOpen = hopOpen && hopLinked && Boolean(hopOrderId);
  const useOpenRow = openRow && canOpen && hopOrderId;

  const waitCue =
    waitLabel?.trim() ? (
      <span
        data-testid="order-mill-wait-label"
        className="shrink-0 text-xs text-muted"
      >
        {waitLabel.trim()}
      </span>
    ) : null;

  const statusPill =
    !waitCue && hopOpen && showStatus && status ? (
      <StatusPill
        status={status === 'requested' ? 'requested' : status}
        label={tradeListStatusLabel(status === 'requested' ? 'requested' : status)}
      />
    ) : null;

  const headerInner = useOpenRow ? (
    <Link
      to={`/orders/${hopOrderId}`}
      data-testid={hopLinkTestId}
      className={cx(
        '-mx-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-0.5 text-inherit no-underline',
        'hover:bg-foam/80 active:bg-foam',
        youIdentity && 'w-full',
      )}
      aria-label={youIdentity ? 'Open your lots' : `Open ${title}`}
    >
      {youIdentity ? null : <Avatar name={title} size={48} />}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-emphasis text-ink">
          {title}
          {showTitleOrderId ? (
            <span className="ml-1.5 text-xs font-emphasis text-accent">
              {shortOrderLabel(hopOrderId)}
            </span>
          ) : null}
        </span>
        {openSubtitle ? (
          <span className="mt-0.5 block text-xs text-muted">{openSubtitle}</span>
        ) : null}
      </span>
      {waitCue}
      {statusPill}
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" aria-hidden />
    </Link>
  ) : (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {!youIdentity && openRow ? <Avatar name={title} size={48} /> : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-emphasis text-ink">
            {title}
            {hopOpen && hopOrderId && !hopLinked && showTitleOrderId ? (
              <span className="ml-1.5 text-xs font-emphasis text-accent">
                {shortOrderLabel(hopOrderId)}
              </span>
            ) : null}
          </p>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {headerTrailing}
        {waitCue}
        {statusPill}
      </div>
    </>
  );

  return (
    <Card
      className={cx(
        'flex flex-col gap-3',
        millDeskCardClass(dropped),
        youIdentity && 'overflow-hidden',
        className,
      )}
      data-testid={testId}
    >
      <div
        className={cx(
          'flex items-start justify-between gap-2',
          youIdentity && '-mx-4 -mt-4 border-b border-line bg-foam/80 px-4 pb-3 pt-4',
          useOpenRow && youIdentity && 'items-center',
        )}
      >
        {headerInner}
        {useOpenRow && headerTrailing ? (
          <div className="flex shrink-0 items-center gap-1">{headerTrailing}</div>
        ) : null}
      </div>
      {children}
      {footer}
    </Card>
  );
}
