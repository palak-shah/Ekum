import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { statusClasses, statusLabel, toneClasses, type StatusTone } from '@/lib/status';
import { initials } from '@/lib/format';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark disabled:opacity-50',
  secondary: 'bg-surface text-accent border-[1.5px] border-accent hover:bg-foam disabled:opacity-50',
  ghost: 'text-accent hover:bg-foam disabled:opacity-50',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:opacity-50',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        BUTTON_VARIANT[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-2xl border border-line bg-surface p-4', className)}>
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
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        'min-h-24 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        statusClasses(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: StatusTone }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', toneClasses(tone))}>
      {children}
    </span>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name) || '?'}
    </span>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
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
      <span className="text-sm">{label}</span>
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
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface/70 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message ? <p className="max-w-xs text-sm text-muted">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-6 py-10 text-center">
      <p className="text-sm font-medium text-danger">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** A bottom sheet — the app's primary way to surface contextual actions. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-surface p-5 pb-8 shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        {title ? <h3 className="mb-4 text-base font-semibold text-ink">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
