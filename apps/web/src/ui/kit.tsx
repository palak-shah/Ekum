import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { statusClasses, statusLabel, toneClasses, type StatusTone } from '@/lib/status';
import { initials } from '@/lib/format';
import { BackIcon, CloseIcon } from '@/ui/icons';
import { cx } from '@/lib/cx';
import { listSquareButtonClass } from '@/ui/ListSearchRow';
import { FORM_CONTROL_WIDTH_CLASS } from '@/ui/mobileOverflow';

export { cx } from '@/lib/cx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark active:bg-accent-dark disabled:opacity-45',
  secondary:
    'bg-surface text-accent border-[1.5px] border-accent hover:bg-foam active:bg-foam disabled:opacity-45',
  ghost: 'text-accent hover:bg-foam active:bg-foam disabled:opacity-45',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:opacity-45',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-bold tracking-tight transition-colors disabled:cursor-not-allowed',
        BUTTON_VARIANT[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
}

/** Prototype chip — one style system for filters and action cues. */
export function Chip({
  children,
  active = false,
  onClick,
  className,
  type = 'button',
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const classes = cx(
    'inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-bold tracking-tight transition-colors',
    active
      ? 'border-accent bg-accent text-white'
      : 'border-line bg-surface text-slate hover:border-accent',
    className,
  );
  // Span when nested in a Link (no button-in-anchor).
  if (!onClick) {
    return <span className={classes}>{children}</span>;
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

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

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]', className)}>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? (
        <span className="text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cx(
          // text-base (16px) avoids iOS focus-zoom; width bound stops WebKit intrinsic min-width blowout (BM-07).
          FORM_CONTROL_WIDTH_CLASS,
          'min-h-[46px] rounded-[13px] border border-line bg-surface px-3.5 text-base font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent/25',
          className,
        )}
        {...props}
      />
    );
  },
);

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        FORM_CONTROL_WIDTH_CLASS,
        'min-h-24 rounded-[13px] border border-line bg-surface px-3.5 py-2.5 text-base font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent/25',
        className,
      )}
      {...props}
    />
  );
}

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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
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
  size = 40,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name) || '?'}
    </span>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-0.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate">{title}</h2>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent',
        className,
      )}
      aria-label="Loading"
    />
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-muted">
      <Spinner />
      <span className="text-sm font-medium">{label}</span>
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
      <p className="text-sm font-bold text-ink">{title}</p>
      {message ? <p className="max-w-xs text-sm text-muted">{message}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-danger-soft px-6 py-10 text-center">
      <p className="text-sm font-semibold text-danger">{message}</p>
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
        'text-sm font-medium leading-snug',
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
  children,
  footer,
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  /** Previous step in this sheet. Same 46×46 square as Close; does not dismiss. */
  onBack?: () => void;
  backTestId?: string;
  title?: string;
  children: ReactNode;
  /** Pinned below the scroll region (e.g. primary action + compact fields). */
  footer?: ReactNode;
  /** Extra classes on the panel (e.g. a fixed height so select does not resize). */
  panelClassName?: string;
}) {
  if (!open || typeof document === 'undefined') {
    return null;
  }
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button aria-label="Close" className="absolute inset-0 bg-ink/35" onClick={onClose} />
      <div
        className={cx(
          'ekum-sheet relative z-10 flex max-h-[min(92dvh,40rem)] w-full max-w-md flex-col rounded-t-[22px] bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5 shadow-[var(--shadow-soft)]',
          panelClassName,
        )}
      >
        <div className="mx-auto mb-3.5 h-1 w-[42px] shrink-0 rounded-full bg-line" />
        {title || onBack ? (
          <div className="mb-4 flex shrink-0 items-center gap-2">
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
              <h3 className="min-w-0 flex-1 text-base font-bold tracking-tight text-ink">{title}</h3>
            ) : (
              <span className="min-w-0 flex-1" />
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={cx(listSquareButtonClass, 'text-slate')}
            >
              <CloseIcon width={20} height={20} />
            </button>
          </div>
        ) : null}
        <div className="ekum-no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="shrink-0 border-t border-line pt-3 mt-2">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
