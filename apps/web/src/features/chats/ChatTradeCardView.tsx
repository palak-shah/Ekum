import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { timeAgo } from '@/lib/format';
import { kindToneClassesForMessageType } from '@/lib/kindTone';
import { cx } from '@/ui/kit';
import { KindIconBadge } from './KindIconBadge';
import { PhotoAlbum } from './PhotoAlbum';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import type { ChatTradeCardModel } from './chatTradeCard';
import { MSG_BUBBLE_CLASS } from './messageChrome';
import { chatBubbleCorners } from './chatBubbleCorners';

function typeKeyForKind(kind: ChatTradeCardModel['kind']): string {
  if (kind === 'order') return 'order_card';
  if (kind === 'quote') return 'rate';
  if (kind === 'collection') return 'collection_card';
  return 'product_card';
}

function isAmountLine(line: string): boolean {
  return /₹/.test(line);
}

function renderAction(action: NonNullable<ChatTradeCardModel['action']>): ReactNode {
  const linkClass = 'text-accent';
  const solidClass =
    'mt-1 w-full rounded-xl border border-line bg-surface px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight text-ink';
  const primaryClass =
    'mt-1 w-full rounded-xl bg-accent px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight text-white';

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
          data-testid={action.testId}
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
        className={cx('mt-1 text-[13px] font-semibold tracking-tight', linkClass)}
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
        data-testid={action.testId}
        onClick={(event) => {
          event.stopPropagation();
          action.onClick?.();
        }}
        className={cx('mt-1 self-start text-[13px] font-semibold tracking-tight', linkClass)}
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
  primary,
  highlight,
}: {
  kind: ChatTradeCardModel['kind'];
  primary: string;
  highlight: (text: string) => ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-line/70 px-2.5 py-2">
      <KindIconBadge messageType={typeKeyForKind(kind)} />
      <p
        className={cx(
          'min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-ink',
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
  const hasThumbs = model.thumbs.length > 0;
  const hasFooter = Boolean(model.actionRow && model.actionRow.length > 0);
  const note = model.note?.trim() || '';

  return (
    <div className="flex flex-col">
      <div className={cx('flex gap-2.5 px-2.5 py-2', hasThumbs ? 'items-start' : 'items-stretch')}>
        {hasThumbs ? (
          <div className="shrink-0 pt-0.5">
            <PhotoAlbum
              urls={model.thumbs}
              overflowCount={model.thumbOverflow ?? 0}
              size="thumb"
              locked={Boolean(model.imagesLocked)}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {model.who ? (
            <p className="text-[12px] font-medium leading-snug text-muted">{highlight(model.who)}</p>
          ) : null}
          {model.details.map((line, index) => {
            const amount = isAmountLine(line);
            return (
              <p
                key={index}
                className={cx(
                  'whitespace-pre-wrap break-words leading-snug',
                  amount
                    ? 'text-[15px] font-semibold tracking-tight text-ink tabular-nums'
                    : 'text-[12px] font-medium text-muted',
                )}
              >
                {highlight(line)}
              </p>
            );
          })}
          {note ? (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] font-medium leading-snug text-ink">
              {highlight(note)}
            </p>
          ) : null}
          {model.noteVoiceUrl ? (
            <div className="mt-1">
              <VoicePlayer src={model.noteVoiceUrl} durationMs={model.noteVoiceDurationMs} />
            </div>
          ) : null}
          {!hasFooter ? (
            <>
              {model.action ? renderAction(model.action) : null}
              {model.secondaryAction ? (
                model.secondaryAction.onClick ? (
                  <button
                    type="button"
                    data-card-action
                    onClick={(event) => {
                      event.stopPropagation();
                      model.secondaryAction?.onClick?.();
                    }}
                    className="mt-1 self-start text-[13px] font-semibold tracking-tight text-accent"
                  >
                    {model.secondaryAction.label}
                  </button>
                ) : (
                  <p className="mt-1 text-[12px] font-medium text-muted">
                    {model.secondaryAction.label}
                  </p>
                )
              ) : null}
            </>
          ) : null}
          <p className="mt-1 text-right text-[11px] text-muted">{timeAgo(model.createdAt)}</p>
        </div>
      </div>
      {hasFooter ? (
        <div
          className="grid border-t border-line/70"
          style={{ gridTemplateColumns: `repeat(${model.actionRow!.length}, minmax(0, 1fr))` }}
        >
          {model.actionRow!.map((action, index) => {
            const accent = action.emphasis !== 'quiet';
            return (
              <button
                key={`${action.label}-${index}`}
                type="button"
                data-card-action
                data-testid={action.testId}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onClick?.();
                }}
                className={cx(
                  'px-2 py-2 text-center text-[12px] font-semibold leading-tight tracking-tight',
                  index > 0 && 'border-l border-line/70',
                  accent ? 'text-accent' : 'text-muted',
                )}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
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
      MSG_BUBBLE_CLASS,
      'w-full rounded-xl border border-line border-l-[3px] bg-surface px-2.5 py-2 text-left',
      tone?.rail ?? 'border-l-accent',
      open && 'hover:bg-canvas active:bg-canvas',
    );
    const body = (
      <>
        <div className="flex items-center gap-1.5">
          <KindIconBadge messageType={typeKeyForKind(model.kind)} size={18} iconSize={12} />
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight text-ink">
            {highlight(model.primary)}
          </p>
        </div>
        {model.who ? (
          <p className="text-[11px] leading-tight text-muted">{highlight(model.who)}</p>
        ) : null}
        {model.details.map((line, index) => (
          <p
            key={index}
            className={cx(
              'truncate leading-snug',
              isAmountLine(line)
                ? 'text-[14px] font-semibold text-ink tabular-nums'
                : 'text-[12px] text-muted',
            )}
          >
            {highlight(line)}
          </p>
        ))}
        {model.note?.trim() ? (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] text-ink">
            {highlight(model.note.trim())}
          </p>
        ) : null}
        {model.noteVoiceUrl ? (
          <div className="mt-1" data-card-action>
            <VoicePlayer src={model.noteVoiceUrl} durationMs={model.noteVoiceDurationMs} />
          </div>
        ) : null}
        {model.action ? <div className="mt-1">{renderAction(model.action)}</div> : null}
        <p className="mt-1 text-right text-[11px] text-muted">{timeAgo(model.createdAt)}</p>
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
        MSG_BUBBLE_CLASS,
        'w-full overflow-hidden border border-line border-l-[3px] bg-surface text-sm',
        chatBubbleCorners(model.mine),
        tone?.rail ?? 'border-l-accent',
        open && 'cursor-pointer',
      )}
      data-testid="chat-trade-card"
      data-mine={model.mine ? 'true' : 'false'}
    >
      <PrimaryHeader kind={model.kind} primary={model.primary} highlight={highlight} />
      <CardBody model={model} highlight={highlight} />
    </div>
  );
}
