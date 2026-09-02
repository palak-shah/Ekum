import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { timeAgo } from '@/lib/format';
import { kindToneClassesForMessageType } from '@/lib/kindTone';
import { cx } from '@/ui/kit';
import { KindIconBadge } from './KindIconBadge';
import { PhotoAlbum } from './PhotoAlbum';
import type { ChatTradeCardModel } from './chatTradeCard';

function typeKeyForKind(kind: ChatTradeCardModel['kind']): string {
  if (kind === 'order') return 'order_card';
  if (kind === 'quote') return 'rate';
  if (kind === 'collection') return 'collection_card';
  return 'product_card';
}

function renderAction(
  action: NonNullable<ChatTradeCardModel['action']>,
  mine: boolean,
): ReactNode {
  const linkClass = mine
    ? 'text-white underline decoration-white/50'
    : 'text-accent';
  const solidClass = mine
    ? 'mt-1 w-full rounded-lg border border-white/40 bg-white/15 px-2 py-1.5 text-center text-xs font-bold text-white'
    : 'mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-xs font-bold text-ink';
  const primaryClass =
    'mt-1 w-full rounded-lg bg-accent px-2 py-1.5 text-center text-xs font-bold text-white';

  if (action.style === 'primary' && action.onClick) {
    return (
      <button
        type="button"
        data-card-action
        data-testid={action.testId}
        onClick={(event) => {
          event.stopPropagation();
          action.onClick?.();
        }}
        className={primaryClass}
      >
        {action.label}
      </button>
    );
  }
  if (action.style === 'solid') {
    if (action.to) {
      return (
        <Link
          to={action.to}
          data-card-action
          onClick={(event) => event.stopPropagation()}
          className={solidClass}
        >
          {action.label}
        </Link>
      );
    }
    if (action.onClick) {
      return (
        <button
          type="button"
          data-card-action
          onClick={(event) => {
            event.stopPropagation();
            action.onClick?.();
          }}
          className={solidClass}
        >
          {action.label}
        </button>
      );
    }
  }
  if (action.to) {
    return (
      <Link
        to={action.to}
        data-card-action
        onClick={(event) => event.stopPropagation()}
        className={cx('mt-0.5 text-xs font-bold', linkClass)}
      >
        {action.label}
      </Link>
    );
  }
  if (action.onClick) {
    return (
      <button
        type="button"
        data-card-action
        onClick={(event) => {
          event.stopPropagation();
          action.onClick?.();
        }}
        className={cx('mt-0.5 self-start text-xs font-bold', linkClass)}
      >
        {action.label}
      </button>
    );
  }
  return null;
}

/** Header = primary title (order id + action / pack / design name); kind badge, no type word. */
function PrimaryHeader({
  kind,
  mine,
  primary,
  highlight,
}: {
  kind: ChatTradeCardModel['kind'];
  mine: boolean;
  primary: string;
  highlight: (text: string) => ReactNode;
}) {
  return (
    <div
      className={cx(
        'flex items-center gap-1.5 px-2 py-1',
        mine ? 'border-b border-white/20' : 'border-b border-line/70',
      )}
    >
      <KindIconBadge messageType={typeKeyForKind(kind)} />
      <p
        className={cx(
          'min-w-0 flex-1 truncate text-xs font-bold tracking-tight',
          mine ? 'text-white' : 'text-ink',
          (kind === 'order' || kind === 'quote') && 'whitespace-nowrap',
        )}
      >
        {highlight(primary)}
      </p>
    </div>
  );
}

function CardBody({
  model,
  highlight,
}: {
  model: ChatTradeCardModel;
  highlight: (text: string) => ReactNode;
}) {
  const muted = model.mine ? 'text-white/75' : 'text-muted';
  const linkAction = model.mine ? 'text-white underline decoration-white/50' : 'text-accent';
  const hasThumbs = model.thumbs.length > 0;

  return (
    <div className={cx('flex gap-2 px-2 py-1.5', hasThumbs ? 'items-start' : 'items-stretch')}>
      {hasThumbs ? (
        <div className="shrink-0 pt-0.5">
          <PhotoAlbum
            urls={model.thumbs}
            overflowCount={model.thumbOverflow ?? 0}
            size="thumb"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        {model.who ? (
          <p className={cx('text-[10px] leading-tight', model.mine ? 'text-white/55' : 'text-muted')}>
            {highlight(model.who)}
          </p>
        ) : null}
        {model.details.map((line, index) => (
          <p key={index} className={cx('text-[11px] font-medium leading-snug', muted)}>
            {highlight(line)}
          </p>
        ))}
        {model.action ? renderAction(model.action, model.mine) : null}
        {model.secondaryAction ? (
          model.secondaryAction.onClick ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                model.secondaryAction?.onClick?.();
              }}
              className={cx('mt-0.5 self-start text-xs font-medium', linkAction)}
            >
              {model.secondaryAction.label}
            </button>
          ) : (
            <p className={cx('mt-0.5 text-xs font-medium', muted)}>{model.secondaryAction.label}</p>
          )
        ) : null}
        <p className={cx('mt-0.5 text-right text-[10px]', muted)}>{timeAgo(model.createdAt)}</p>
      </div>
    </div>
  );
}

export function ChatTradeCard({
  model,
  highlight = (text) => text,
  onOpen,
  selecting = false,
}: {
  model: ChatTradeCardModel;
  highlight?: (text: string) => ReactNode;
  onOpen?: () => void;
  selecting?: boolean;
}) {
  const open = onOpen && !selecting ? onOpen : undefined;
  const tone = kindToneClassesForMessageType(typeKeyForKind(model.kind));

  if (model.variant === 'pulse') {
    const pulseClass = cx(
      'w-full rounded-lg border border-line border-l-[3px] px-2.5 py-2 text-left',
      model.mine ? 'bg-accent/15' : 'bg-surface/90',
      tone?.rail ?? 'border-l-accent',
      open && (model.mine ? 'hover:bg-accent/25 active:bg-accent/30' : 'hover:bg-foam active:bg-linen'),
    );
    const body = (
      <>
        <div className="flex items-center gap-1.5">
          <KindIconBadge messageType={typeKeyForKind(model.kind)} size={18} iconSize={12} />
          <p
            className={cx(
              'min-w-0 flex-1 truncate text-sm font-bold tracking-tight',
              model.mine ? 'text-accent-dark' : tone?.ink ?? 'text-accent',
            )}
          >
            {highlight(model.primary)}
          </p>
        </div>
        {model.who ? (
          <p className={cx('text-[11px] leading-tight', model.mine ? 'text-slate' : 'text-muted')}>
            {highlight(model.who)}
          </p>
        ) : null}
        {model.details.map((line, index) => (
          <p key={index} className={cx('truncate text-sm', model.mine ? 'text-slate' : 'text-muted')}>
            {highlight(line)}
          </p>
        ))}
        {model.action ? (
          <div className="mt-1">{renderAction(model.action, model.mine)}</div>
        ) : null}
        <p className={cx('mt-1 text-right text-xs', 'text-muted')}>{timeAgo(model.createdAt)}</p>
      </>
    );
    if (!open) {
      return <div className={pulseClass}>{body}</div>;
    }
    return (
      <button
        type="button"
        className={pulseClass}
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      role={open ? 'button' : undefined}
      tabIndex={open ? 0 : undefined}
      onClick={
        open
          ? (event) => {
              if ((event.target as HTMLElement).closest('[data-card-action]')) return;
              open();
            }
          : undefined
      }
      onKeyDown={
        open
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
              }
            }
          : undefined
      }
      className={cx(
        'w-full overflow-hidden rounded-2xl border border-l-[3px] text-sm shadow-sm',
        model.mine
          ? 'rounded-br-md border-y-accent/35 border-r-accent/35 bg-accent text-white'
          : 'rounded-bl-md border-y-line border-r-line bg-foam text-ink',
        tone?.rail ?? 'border-l-accent',
        open && 'cursor-pointer',
      )}
    >
      <PrimaryHeader
        kind={model.kind}
        mine={model.mine}
        primary={model.primary}
        highlight={highlight}
      />
      <CardBody model={model} highlight={highlight} />
    </div>
  );
}
