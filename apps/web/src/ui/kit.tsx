import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { statusClasses, statusLabel, toneClasses, type StatusTone } from '@/lib/status';
import { initials } from '@/lib/format';
import { avatarTone } from '@/ui/avatarTone';
import { BackIcon, CloseIcon, GroupIcon, SearchIcon } from '@/ui/icons';
import { InfoHint } from '@/ui/InfoHint';
import { cx } from '@/lib/cx';
import { listSquareButtonClass } from '@/ui/ListSearchRow';
import { MEDIA_VARIANT } from '@ekum/domain-types';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { ManagedImage } from '@/ui/ManagedImage';
import { textInputChromeClass } from '@/ui/mobileOverflow';
import { chipCountBadge } from '@/ui/chipBadge';

export { cx } from '@/lib/cx';
export { InfoHint } from '@/ui/InfoHint';
export { GroupIcon, LinkIcon } from '@/ui/icons';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-dark active:bg-accent-dark disabled:bg-accent-muted disabled:text-on-accent disabled:opacity-100',
  secondary:
    'bg-surface text-accent border-[1.5px] border-accent hover:bg-foam active:bg-foam disabled:opacity-45',
  ghost: 'text-accent hover:bg-foam active:bg-foam disabled:opacity-45',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:opacity-45',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  /** Shared click-lock: Spinner + disabled so they cannot double-tap. */
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth,
  className,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-emphasis tracking-tight transition-colors disabled:cursor-not-allowed',
        BUTTON_VARIANT[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Spinner
          label={false}
          className={
            variant === 'primary' ? 'border-on-accent/35 border-t-on-accent' : undefined
          }
        />
      ) : null}
      {children}
    </button>
  );
}

/** Filter-rail chip — gray foam idle; selected is chip-on tint. */
export function Chip({
  children,
  active = false,
  onClick,
  className,
  type = 'button',
  compact = true,
  'data-testid': dataTestId,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  compact?: boolean;
  'data-testid'?: string;
}) {
  const classes = cx(
    'inline-flex shrink-0 items-center justify-center rounded-lg tracking-tight transition-colors',
    compact ? 'h-8 px-2.5 text-meta' : 'h-8 px-3 text-meta',
    active ? 'bg-chip-on font-title text-chip-on-ink' : 'bg-foam font-emphasis text-slate',
    className,
  );
  // Span when nested in a Link (no button-in-anchor).
  if (!onClick) {
    return (
      <span className={classes} data-testid={dataTestId}>
        {children}
      </span>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes} data-testid={dataTestId}>
      {children}
    </button>
  );
}

/** Lime count on a Chip — Chats Unread, Orders Need you. Hidden at 0. Dark ink on lime. */
export function ChipCountBadge({
  count,
  inverted = false,
}: {
  count: number;
  inverted?: boolean;
}) {
  const label = chipCountBadge(count);
  if (!label) return null;
  return (
    <span
      className={cx(
        'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[length:var(--ekum-text-badge)] font-bold',
        inverted ? 'bg-badge text-badge-ink' : 'bg-badge text-badge-ink',
      )}
    >
      {label}
    </span>
  );
}

/** Hairline + foam press for flat lists (inbox, Followed, Settings). Not cards. */
export const listRowClass =
  'border-b border-line px-4 py-3 last:border-b-0 hover:bg-foam active:bg-foam';

/** Horizontal filter rail — keeps chips intentional, not scattered. */
export function FilterRail({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        '-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Card({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-xl border border-line bg-surface p-4', className)} {...rest}>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  /** Instructional copy on the shared circle i — not live status (that stays `hint`). */
  info?: string;
  error?: string | null;
  /** Shows a red * on the label so required is obvious before submit. */
  required?: boolean;
  /** Merged onto the root label (e.g. tighter gap-1 on dense forms). */
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, info, error, required, className, children }: FieldProps) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      <span className="flex items-center gap-0.5">
        <span className="text-sm font-emphasis text-ink">
          {label}
          {required ? (
            <span className="text-danger" aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </span>
        {info ? <InfoHint label={`About ${label}`}>{info}</InfoHint> : null}
      </span>
      {children}
      {error ? (
        <span className="text-xs font-body text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs font-body text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput(
    { className, disabled, readOnly, placeholder, onFocus, onBlur, ...props },
    ref,
  ) {
    const locked = Boolean(disabled || readOnly);
    const [focused, setFocused] = useState(false);
    return (
      <input
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
        placeholder={focused ? undefined : placeholder}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={cx(
          // text-base (16px) avoids iOS focus-zoom unless caller sets compact text-*;
          // width / pad / min-h merge via textInputChromeClass (BM-07 clipped nums).
          // Locked (disabled / readOnly) = foam fill so editable fields stay obvious.
          textInputChromeClass(className, { locked }),
          className,
        )}
      />
    );
  },
);

/** WhatsApp-style find field: leading search icon, keyboard Enter labeled Search. */
export const SearchInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { compact?: boolean }
>(function SearchInput({ className, compact: _compact, autoFocus, ...props }, ref) {
    const innerRef = useRef<HTMLInputElement>(null);
    // Native autoFocus is ignored after a tap that mounts the field (iPhone/Android).
    useLayoutEffect(() => {
      if (!autoFocus) return;
      innerRef.current?.focus();
    }, [autoFocus]);
    return (
      <div className={cx('relative min-w-0 w-full', className)}>
        <SearchIcon
          width={16}
          height={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-muted"
        />
        <TextInput
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          autoComplete="off"
          {...props}
          type="search"
          enterKeyHint="search"
          inputMode="search"
          className="w-full pl-9 pr-3.5 [&::-webkit-search-decoration]:appearance-none"
        />
      </div>
    );
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea(
  { className, disabled, readOnly, placeholder, onFocus, onBlur, ...props },
  ref,
) {
  const locked = Boolean(disabled || readOnly);
  const [focused, setFocused] = useState(false);
  const hasMinH = Boolean(className && /(?:^|\s)(?:\S+:)*min-h-/.test(` ${className}`));
  const chromeSource = [!hasMinH ? 'min-h-24' : '', className].filter(Boolean).join(' ');
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      readOnly={readOnly}
      {...props}
      placeholder={focused ? undefined : placeholder}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      className={cx(
        textInputChromeClass(chromeSource, { locked }),
        !hasMinH && 'min-h-24',
        'px-3.5 py-2.5',
        className,
      )}
    />
  );
});

export function StatusPill({
  status,
  label,
}: {
  status: string;
  /** Override display text (e.g. return `requested` → Raised). */
  label?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-meta font-emphasis',
        statusClasses(status),
      )}
    >
      {label ?? statusLabel(status)}
    </span>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: StatusTone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-meta font-emphasis',
        toneClasses(tone),
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  imageUrl,
  size = 36,
  fallback = 'initials',
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  /** Group chats with no photo use a people glyph, not a letter. */
  fallback?: 'initials' | 'group';
}) {
  const src = imageUrl?.trim() ? toAbsoluteMediaUrl(imageUrl) : '';
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <ManagedImage
        src={src}
        alt={name}
        variant={MEDIA_VARIANT.Thumbnail1}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        draggable={false}
        onError={() => setBroken(true)}
      />
    );
  }
  if (fallback === 'group') {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-foam text-muted"
        style={{ width: size, height: size }}
        aria-hidden
        data-testid="avatar-group-fallback"
      >
        <GroupIcon width={Math.round(size * 0.48)} height={Math.round(size * 0.48)} />
      </span>
    );
  }
  const tone = avatarTone(name);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: tone.bg,
        color: tone.ink,
      }}
    >
      {initials(name) || '?'}
    </span>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-0.5">
      <h2 className="text-meta font-emphasis tracking-tight text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function Spinner({
  className,
  label = 'Loading',
}: {
  className?: string;
  /** `false` when the parent already exposes busy (Button loading). */
  label?: string | false;
}) {
  return (
    <span
      className={cx(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent',
        className,
      )}
      aria-label={label === false ? undefined : label}
      aria-hidden={label === false ? true : undefined}
    />
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-muted">
      <Spinner />
      <span className="text-sm font-body">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-linen', className)} />;
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-[15px] font-title text-ink">{title}</p>
      {message ? <p className="max-w-xs text-sm font-body text-muted">{message}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-danger-soft px-6 py-10 text-center">
      <p className="text-sm font-emphasis text-danger">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** In-context failure (sheets / forms) — left-aligned, readable; not a buried page banner. */
export function InlineNotice({
  message,
  tone = 'danger',
  className,
}: {
  message: string;
  tone?: 'danger' | 'muted';
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cx(
        'text-sm font-body leading-snug',
        tone === 'danger' ? 'text-danger' : 'text-muted',
        className,
      )}
    >
      {message}
    </p>
  );
}

/**
 * Bottom sheet. Portaled to document.body so it always stacks above the
 * AppShell bottom nav (nav is z-20; sheets rendered inside <main> were trapped
 * under it and hid primary CTAs like "Send request").
 */
export function Sheet({
  open,
  onClose,
  onBack,
  backTestId = 'sheet-back',
  title,
  titleInfo,
  titleInfoTestId,
  headerAction,
  children,
  footer,
  panelClassName,
  size = 'sheet',
}: {
  open: boolean;
  onClose: () => void;
  /** Previous step in this sheet. Same 40×40 square as Close; does not dismiss. */
  onBack?: () => void;
  backTestId?: string;
  title?: string;
  /** Instructional copy on the shared circle i beside the title. */
  titleInfo?: string;
  titleInfoTestId?: string;
  /** Optional control before Close (e.g. ⋯). */
  headerAction?: ReactNode;
  children: ReactNode;
  /** Pinned below the scroll region (e.g. primary action + compact fields). */
  footer?: ReactNode;
  /** Extra classes on the panel (e.g. a fixed height so select does not resize). */
  panelClassName?: string;
  /** `full` = edge-to-edge; default hugs content up to 100dvh, then body scrolls. */
  size?: 'sheet' | 'full';
}) {
  useEffect(() => {
    if (!open) return;
    // Viewport shrink (soft keyboard) does not move focus. Keep the field in the sheet.
    const scrollFocused = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      if (!active.closest('.ekum-sheet')) return;
      active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    window.addEventListener('resize', scrollFocused);
    window.visualViewport?.addEventListener('resize', scrollFocused);
    return () => {
      window.removeEventListener('resize', scrollFocused);
      window.visualViewport?.removeEventListener('resize', scrollFocused);
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }
  const full = size === 'full';
  return createPortal(
    <div
      className={cx(
        'fixed inset-0 z-[80] flex justify-center',
        full ? 'items-stretch' : 'items-end',
      )}
      role="dialog"
      aria-modal="true"
    >
      {full ? null : (
        <button aria-label="Dismiss" className="absolute inset-0 bg-ink/35" onClick={onClose} />
      )}
      <div
        className={cx(
          'ekum-sheet relative z-10 flex min-h-0 w-full max-w-md flex-col overflow-hidden bg-surface',
          full
            ? 'h-[100dvh] max-h-[100dvh] rounded-none px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] shadow-none'
            : 'max-h-[100dvh] rounded-t-2xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5 shadow-[var(--shadow-soft)]',
          panelClassName,
        )}
      >
        {full ? null : (
          <>
            <button
              type="button"
              aria-label="Close"
              data-testid="sheet-close"
              onClick={onClose}
              className={cx(
                listSquareButtonClass,
                'absolute right-2 top-2 z-20 text-slate',
              )}
            >
              <CloseIcon width={20} height={20} />
            </button>
            <div className="mx-auto mb-3.5 h-1 w-[42px] shrink-0 rounded-full bg-line" />
          </>
        )}
        {title || onBack || full ? (
          <div
            className={cx(
              'flex shrink-0 items-center gap-2',
              full ? 'mb-3' : headerAction ? 'mb-4 pr-28' : 'mb-4 pr-14',
            )}
          >
            {onBack ? (
              <button
                type="button"
                aria-label="Back"
                data-testid={backTestId}
                onClick={onBack}
                className={cx(listSquareButtonClass, 'text-slate')}
              >
                <BackIcon width={20} height={20} />
              </button>
            ) : null}
            {title ? (
              <div className="flex min-w-0 flex-1 items-center gap-0.5">
                <h3 className="min-w-0 truncate text-sheet-title font-title tracking-tight text-ink">
                  {title}
                </h3>
                {titleInfo ? (
                  <InfoHint label={`About ${title}`} testId={titleInfoTestId}>
                    {titleInfo}
                  </InfoHint>
                ) : null}
              </div>
            ) : (
              <span className="min-w-0 flex-1" />
            )}
            {full ? headerAction : null}
            {full ? (
              <button
                type="button"
                aria-label="Close"
                data-testid="sheet-close"
                onClick={onClose}
                className={cx(listSquareButtonClass, 'text-slate')}
              >
                <CloseIcon width={20} height={20} />
              </button>
            ) : headerAction ? (
              <div className="absolute right-16 top-2 z-20">{headerAction}</div>
            ) : null}
          </div>
        ) : null}
        {full ? (
          /**
           * Pack body + footer under the header. Short lists leave empty space
           * below the composer (not a dead band between list and actions).
           * Long lists scroll; footer sticks to the bottom of the scrollport.
           */
          <div
            className="ekum-no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
            data-testid="sheet-full-scroll"
          >
            <div className="shrink-0">{children}</div>
            {footer ? (
              <div className="sticky bottom-0 z-[1] -mx-4 shrink-0 border-t border-line bg-canvas px-4 pt-3 pb-1">
                {footer}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="ekum-no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer ? (
              <div className="mt-3 shrink-0 border-t border-line pt-3.5">{footer}</div>
            ) : null}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
