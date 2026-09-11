import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { timeAgo } from '@/lib/format';
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

/** Direction owns fill; status never picks a third surface. */
function directionChrome(mine: boolean) {
  if (mine) {
    return {
      shell: 'border border-accent/35 bg-accent text-white',
      pulseShell: 'border border-accent/35 bg-accent text-white',
      headerBorder: 'border-white/20',
      title: 'text-white',
      who: 'text-white/70',
      detailMuted: 'text-white/70',
      detailStrong: 'text-white',
      note: 'text-white',
      time: 'text-white/65',
      link: 'text-white',
      footerBorder: 'border-white/20',
      footerAccent: 'text-white',
      footerQuiet: 'text-white/65',
      primaryBtn:
        'mt-1 w-full rounded-xl bg-surface px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight text-ink',
      solidBtn:
        'mt-1 w-full rounded-xl border border-white/35 bg-white/10 px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight text-white',
      hoverOpen: 'hover:brightness-[0.97] active:brightness-[0.94]',
    };
  }
  return {
    shell: 'border border-line border-l-[3px] border-l-accent bg-surface text-ink',
    pulseShell: 'border border-line border-l-[3px] border-l-accent bg-surface text-ink',
    headerBorder: 'border-line/70',
    title: 'text-ink',
    who: 'text-muted',
    detailMuted: 'text-muted',
    detailStrong: 'text-ink',
    note: 'text-ink',
    time: 'text-muted',
    link: 'text-accent',
    footerBorder: 'border-line/70',
    footerAccent: 'text-accent',
    footerQuiet: 'text-muted',
    primaryBtn:
      'mt-1 w-full rounded-xl bg-accent px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight text-white',
    solidBtn:
      'mt-1 w-full rounded-xl border border-line bg-surface px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight text-ink',
    hoverOpen: 'hover:bg-canvas active:bg-canvas',
  };
}

function renderAction(
  action: NonNullable<ChatTradeCardModel['action']>,
  chrome: ReturnType<typeof directionChrome>,
): ReactNode {
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
        className={chrome.primaryBtn}
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
          className={chrome.solidBtn}
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
          className={chrome.solidBtn}
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
        className={cx('mt-1 text-[13px] font-semibold tracking-tight', chrome.link)}
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
        className={cx('mt-1 self-start text-[13px] font-semibold tracking-tight', chrome.link)}
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
  chrome,
  onAccent,
}: {
  kind: ChatTradeCardModel['kind'];
  primary: string;
  highlight: (text: string) => ReactNode;
  chrome: ReturnType<typeof directionChrome>;
  onAccent: boolean;
}) {
  return (
    <div className={cx('flex items-center gap-2 border-b px-2.5 py-2', chrome.headerBorder)}>
      <KindIconBadge messageType={typeKeyForKind(kind)} onAccent={onAccent} />
      <p
        className={cx(
          'min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight',
          chrome.title,
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
  chrome,
}: {
  model: ChatTradeCardModel;
  highlight: (text: string) => ReactNode;
  chrome: ReturnType<typeof directionChrome>;
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
            <p className={cx('text-[12px] font-medium leading-snug', chrome.who)}>
              {highlight(model.who)}
            </p>
          ) : null}
          {model.details.map((line, index) => {
            const amount = isAmountLine(line);
            return (
              <p
                key={index}
                className={cx(
                  'whitespace-pre-wrap break-words leading-snug',
                  amount
                    ? cx('text-[15px] font-semibold tracking-tight tabular-nums', chrome.detailStrong)
                    : cx('text-[12px] font-medium', chrome.detailMuted),
                )}
              >
                {highlight(line)}
              </p>
            );
          })}
          {note ? (
            <p
              className={cx(
                'mt-0.5 whitespace-pre-wrap break-words text-[12px] font-medium leading-snug',
                chrome.note,
              )}
            >
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
              {model.action ? renderAction(model.action, chrome) : null}
              {model.secondaryAction ? (
                model.secondaryAction.onClick ? (
                  <button
                    type="button"
                    data-card-action
                    onClick={(event) => {
                      event.stopPropagation();
                      model.secondaryAction?.onClick?.();
                    }}
                    className={cx(
                      'mt-1 self-start text-[13px] font-semibold tracking-tight',
                      chrome.link,
                    )}
                  >
                    {model.secondaryAction.label}
                  </button>
                ) : (
                  <p className={cx('mt-1 text-[12px] font-medium', chrome.detailMuted)}>
                    {model.secondaryAction.label}
                  </p>
                )
              ) : null}
            </>
          ) : null}
          <p className={cx('mt-1 text-right text-[11px]', chrome.time)}>{timeAgo(model.createdAt)}</p>
        </div>
      </div>
      {hasFooter ? (
        <div
          className={cx('grid border-t', chrome.footerBorder)}
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
                  index > 0 && cx('border-l', chrome.footerBorder),
                  accent ? chrome.footerAccent : chrome.footerQuiet,
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
  const chrome = directionChrome(model.mine);

  if (model.variant === 'pulse') {
    // Never use a native <button> shell — Tailwind preflight sets
    // `button { background-color: transparent }`, which strips outgoing teal fill
    // while leaving white link text (pale card + invisible "View order").
    const pulseClass = cx(
      MSG_BUBBLE_CLASS,
      'w-full rounded-xl px-2.5 py-2 text-left',
      chrome.pulseShell,
      open && cx('cursor-pointer', chrome.hoverOpen),
    );
    const body = (
      <>
        <div className="flex items-center gap-1.5">
          <KindIconBadge
            messageType={typeKeyForKind(model.kind)}
            size={18}
            iconSize={12}
            onAccent={model.mine}
          />
          <p
            className={cx(
              'min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight',
              chrome.title,
            )}
          >
            {highlight(model.primary)}
          </p>
        </div>
        {model.who ? (
          <p className={cx('text-[11px] leading-tight', chrome.who)}>{highlight(model.who)}</p>
        ) : null}
        {model.details.map((line, index) => (
          <p
            key={index}
            className={cx(
              'truncate leading-snug',
              isAmountLine(line)
                ? cx('text-[14px] font-semibold tabular-nums', chrome.detailStrong)
                : cx('text-[12px]', chrome.detailMuted),
            )}
          >
            {highlight(line)}
          </p>
        ))}
        {model.note?.trim() ? (
          <p className={cx('mt-0.5 whitespace-pre-wrap break-words text-[12px]', chrome.note)}>
            {highlight(model.note.trim())}
          </p>
        ) : null}
        {model.noteVoiceUrl ? (
          <div className="mt-1" data-card-action>
            <VoicePlayer src={model.noteVoiceUrl} durationMs={model.noteVoiceDurationMs} />
          </div>
        ) : null}
        {model.action ? <div className="mt-1">{renderAction(model.action, chrome)}</div> : null}
        <p className={cx('mt-1 text-right text-[11px]', chrome.time)}>{timeAgo(model.createdAt)}</p>
      </>
    );
    return (
      <div
        role={open ? 'button' : undefined}
        tabIndex={open ? 0 : undefined}
        className={pulseClass}
        data-testid="chat-trade-card-pulse"
        data-mine={model.mine ? 'true' : 'false'}
        onClick={
          open
            ? (event) => {
                if ((event.target as HTMLElement).closest('[data-card-action]')) return;
                event.stopPropagation();
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
      >
        {body}
      </div>
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
        'w-full overflow-hidden text-sm',
        chatBubbleCorners(model.mine),
        chrome.shell,
        open && 'cursor-pointer',
      )}
      data-testid="chat-trade-card"
      data-mine={model.mine ? 'true' : 'false'}
    >
      <PrimaryHeader
        kind={model.kind}
        primary={model.primary}
        highlight={highlight}
        chrome={chrome}
        onAccent={model.mine}
      />
      <CardBody model={model} highlight={highlight} chrome={chrome} />
    </div>
  );
}
