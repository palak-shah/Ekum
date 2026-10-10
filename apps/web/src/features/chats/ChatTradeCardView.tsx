import { Link } from 'react-router-dom';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { timeAgo } from '@/lib/format';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { cx } from '@/ui/kit';
import { KindIconBadge } from './KindIconBadge';
import { PhotoAlbum } from './PhotoAlbum';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import type { ChatTradeCardModel } from './chatTradeCard';
import { MSG_BUBBLE_CLASS } from './messageChrome';
import { useMessageBubbleChevronPad } from './messageBubbleChevronPad';
import { chatBubbleCorners } from './chatBubbleCorners';

function typeKeyForKind(kind: ChatTradeCardModel['kind']): string {
  if (kind === 'order') return 'order_card';
  if (kind === 'quote') return 'rate';
  if (kind === 'collection') return 'collection_card';
  if (kind === 'designs') return 'design_album';
  if (kind === 'complaint') return 'complaint';
  return 'product_card';
}

function isAmountLine(line: string): boolean {
  return /₹/.test(line);
}

/**
 * Direction matches text bubbles: yours = chat-out, theirs = chat-in + rail.
 * Never solid accent fills. CSS vars so Safari paint + theme stay one source.
 */
function directionChrome(mine: boolean) {
  const shell = mine
    ? 'border border-line bg-chat-out text-ink'
    : 'border border-line border-l-[3px] border-l-accent bg-chat-in text-ink';
  return {
    shell,
    pulseShell: shell,
    shellStyle: {
      backgroundColor: mine ? 'var(--ekum-chat-out)' : 'var(--ekum-chat-in)',
      color: 'var(--ekum-ink)',
    } satisfies CSSProperties,
    headerBorder: 'border-line/70',
    title: 'text-ink',
    who: 'text-muted',
    detailMuted: 'text-muted',
    detailStrong: 'text-ink',
    note: 'text-ink',
    time: 'text-muted',
    link: 'text-accent',
    linkColor: 'var(--ekum-accent)',
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

/** Paint shell with !important so utilities / UA sheets cannot strip fill. */
function applyShellPaint(el: HTMLElement | null, style: CSSProperties) {
  if (!el) return;
  const bg = style.backgroundColor;
  const color = style.color;
  if (typeof bg === 'string' && bg) el.style.setProperty('background-color', bg, 'important');
  if (typeof color === 'string' && color) el.style.setProperty('color', color, 'important');
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
        className={cx(
          'block w-full px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight',
          chrome.link,
        )}
        style={{ color: chrome.linkColor }}
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
        className={cx(
          'w-full px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight',
          chrome.link,
        )}
        style={{ color: chrome.linkColor }}
      >
        {action.label}
      </button>
    );
  }
  return null;
}

/**
 * MessageChrome pads the bubble (`pr-8`) for the actions chevron. Bleed section
 * chrome back to the painted card edge so dividers / time sit under the arrow.
 */
const BLEED_CHEVRON_PAD = '-mr-8 w-[calc(100%+2rem)] max-w-none';

/** Section 1 — verbose header + id/status (+ who / details). */
function PrimaryHeader({
  kind,
  primary,
  who,
  details,
  highlight,
  chrome,
  chevronBleed,
}: {
  kind: ChatTradeCardModel['kind'];
  primary: string;
  who?: string | null;
  details: string[];
  highlight: (text: string) => ReactNode;
  chrome: ReturnType<typeof directionChrome>;
  chevronBleed: boolean;
}) {
  return (
    <div
      data-testid="chat-trade-card-header"
      className={cx('border-b', chevronBleed && BLEED_CHEVRON_PAD, chrome.headerBorder)}
    >
      <div className={cx('px-2.5 py-2', chevronBleed && 'pr-8')}>
        <div className="flex items-center gap-2">
          <KindIconBadge messageType={typeKeyForKind(kind)} onAccent={false} />
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
        {who ? (
          <p className={cx('mt-0.5 text-[12px] font-medium leading-snug', chrome.who)}>
            {highlight(who)}
          </p>
        ) : null}
        {details.map((line, index) => {
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
      </div>
    </div>
  );
}

function CardBody({
  model,
  highlight,
  chrome,
  chevronBleed,
}: {
  model: ChatTradeCardModel;
  highlight: (text: string) => ReactNode;
  chrome: ReturnType<typeof directionChrome>;
  chevronBleed: boolean;
}) {
  const hasThumbs = model.thumbs.length > 0;
  const hasFooter = Boolean(model.actionRow && model.actionRow.length > 0);
  const note = model.note?.trim() || '';
  const hasNote = Boolean(note || model.noteVoiceUrl);
  const bleed = chevronBleed ? BLEED_CHEVRON_PAD : undefined;
  /** Reserve space under chevron only when MessageChrome pads the bubble. */
  const underChevron = chevronBleed ? 'pr-8' : undefined;

  const hasLinkActions = !hasFooter && Boolean(model.action || model.secondaryAction);

  return (
    <div className="flex w-full min-w-0 flex-col">
      {hasThumbs ? (
        <div
          data-testid="chat-trade-card-images"
          className="w-full px-2.5 py-2"
          {...(model.kind === 'complaint' ? { 'data-card-action': true } : {})}
        >
          <PhotoAlbum
            urls={model.thumbs}
            overflowCount={model.thumbOverflow ?? 0}
            size="thumb"
            locked={Boolean(model.imagesLocked)}
            interactive={model.kind === 'complaint'}
          />
        </div>
      ) : null}

      {hasNote ? (
        <div
          data-testid="chat-trade-card-note"
          className={cx('relative px-2.5 py-2', bleed)}
        >
          {note ? (
            <p
              className={cx(
                'whitespace-pre-wrap break-words text-[15px] font-semibold tracking-tight leading-snug',
                underChevron,
                chrome.note,
              )}
            >
              {highlight(note)}
            </p>
          ) : null}
          {model.noteVoiceUrl ? (
            <div className={cx(note ? 'mt-1' : undefined, 'min-w-0', underChevron)}>
              <VoicePlayer src={model.noteVoiceUrl} durationMs={model.noteVoiceDurationMs} />
            </div>
          ) : null}
          {/* Under chevron column, inset from the rim (chevron is right-1 / w-7). */}
          <p
            data-testid="chat-trade-card-time"
            className={cx(
              'absolute bottom-2 text-[11px] tabular-nums leading-none',
              chevronBleed ? 'right-3' : 'right-2.5',
              chrome.time,
            )}
          >
            {timeAgo(model.createdAt)}
          </p>
        </div>
      ) : (
        <p
          data-testid="chat-trade-card-time"
          className={cx(
            // Clear bottom-right bubble radius (incoming rounded-br-2xl).
            'px-2.5 pb-2.5 pt-2 text-right text-[11px] tabular-nums',
            bleed,
            hasThumbs && 'pt-0',
            chrome.time,
          )}
        >
          {timeAgo(model.createdAt)}
        </p>
      )}

      {hasLinkActions ? (
        <div
          data-testid="chat-trade-card-actions"
          className={cx('border-t', bleed, chrome.footerBorder)}
        >
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
                  'w-full px-2.5 py-2 text-center text-[13px] font-semibold tracking-tight',
                  chrome.link,
                )}
              >
                {model.secondaryAction.label}
              </button>
            ) : (
              <p className={cx('px-2.5 py-1 text-[12px] font-medium', chrome.detailMuted)}>
                {model.secondaryAction.label}
              </p>
            )
          ) : null}
        </div>
      ) : null}

      {hasFooter ? (
        <div
          data-testid="chat-trade-card-actions"
          className={cx('grid border-t pb-0.5', bleed, chrome.footerBorder)}
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
                  'px-2 py-2.5 text-center text-[12px] font-semibold leading-tight tracking-tight',
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
  const [albumIndex, setAlbumIndex] = useState<number | null>(null);
  const albumUrls = model.thumbs.map((url) => toAbsoluteMediaUrl(url)).filter(Boolean);
  const openAlbum = () => {
    if (albumUrls.length === 0) return;
    setAlbumIndex(0);
  };
  const open =
    selecting
      ? undefined
      : model.kind === 'complaint' && albumUrls.length > 0
        ? openAlbum
        : onOpen
          ? onOpen
          : undefined;
  const chrome = directionChrome(model.mine);
  const chevronBleed = useMessageBubbleChevronPad();
  const album =
    albumIndex === null || albumUrls.length === 0 ? null : (
      <PhotoViewer
        open
        urls={albumUrls}
        index={albumIndex}
        onIndex={setAlbumIndex}
        onClose={() => setAlbumIndex(null)}
        captions={model.thumbCaptions}
      />
    );

  if (model.variant === 'pulse') {
    const pulseClass = cx(
      MSG_BUBBLE_CLASS,
      'w-full px-2.5 py-2 text-left text-sm',
      chatBubbleCorners(model.mine),
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
            onAccent={false}
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
          <div className="mt-1 min-w-0" data-card-action>
            <VoicePlayer src={model.noteVoiceUrl} durationMs={model.noteVoiceDurationMs} />
          </div>
        ) : null}
        {model.action ? (
          <div className="mt-1">
            {model.action.to ? (
              <Link
                to={model.action.to}
                data-card-action
                onClick={(event) => event.stopPropagation()}
                className={cx('text-[13px] font-semibold tracking-tight', chrome.link)}
                style={{ color: chrome.linkColor }}
              >
                {model.action.label}
              </Link>
            ) : model.action.onClick ? (
              <button
                type="button"
                data-card-action
                onClick={(event) => {
                  event.stopPropagation();
                  model.action?.onClick?.();
                }}
                className={cx('text-[13px] font-semibold tracking-tight', chrome.link)}
                style={{ color: chrome.linkColor }}
              >
                {model.action.label}
              </button>
            ) : null}
          </div>
        ) : null}
        <p className={cx('mt-1 text-right text-[11px]', chrome.time)}>{timeAgo(model.createdAt)}</p>
      </>
    );
    return (
      <>
        <div
          role={open ? 'button' : undefined}
          tabIndex={open ? 0 : undefined}
          className={pulseClass}
          ref={(el) => applyShellPaint(el, chrome.shellStyle)}
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
        {album}
      </>
    );
  }

  return (
    <>
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
          // No overflow-hidden: corner radius + clipped bleed/time/footer (BM-07).
          // Thumbs already clip inside PhotoAlbum.
          'w-full text-sm',
          chatBubbleCorners(model.mine),
          chrome.shell,
          open && 'cursor-pointer',
        )}
        ref={(el) => applyShellPaint(el, chrome.shellStyle)}
        data-testid="chat-trade-card"
        data-mine={model.mine ? 'true' : 'false'}
      >
        <PrimaryHeader
          kind={model.kind}
          primary={model.primary}
          who={model.who}
          details={model.details}
          highlight={highlight}
          chrome={chrome}
          chevronBleed={chevronBleed}
        />
        <CardBody
          model={model}
          highlight={highlight}
          chrome={chrome}
          chevronBleed={chevronBleed}
        />
      </div>
      {album}
    </>
  );
}
