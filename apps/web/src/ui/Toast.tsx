import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cx } from '@/ui/kit';

type ToastTone = 'success' | 'danger';

export type ToastAction = {
  label: string;
  to: string;
};

export type ToastOptions = {
  action?: ToastAction;
};

interface ToastContextValue {
  /** Brief acknowledgement above the bottom nav (auto-dismiss). */
  showToast: (message: string, tone?: ToastTone, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 2600;
const DISMISS_WITH_ACTION_MS = 4000;

type ToastState = {
  message: string;
  tone: ToastTone;
  action?: ToastAction;
};

/** Route layout so toasts can navigate (must sit under the data router). */
export function ToastRoot() {
  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success', options?: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone, action: options?.action });
      const dismissMs = options?.action ? DISMISS_WITH_ACTION_MS : DISMISS_MS;
      timer.current = setTimeout(() => setToast(null), dismissMs);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const onAction = () => {
    if (!toast?.action) return;
    const { to } = toast.action;
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
    navigate(to);
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="app-toast"
          className={cx(
            'fixed inset-x-0 z-[90] mx-auto flex max-w-md justify-center px-4',
            'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]',
            toast.action ? 'pointer-events-auto' : 'pointer-events-none',
          )}
        >
          <div
            className={cx(
              'ekum-rise flex max-w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-soft)]',
              toast.tone === 'danger' ? 'bg-danger text-white' : 'bg-ink text-white',
            )}
          >
            <p className="min-w-0 truncate">{toast.message}</p>
            {toast.action ? (
              <button
                type="button"
                className="shrink-0 underline decoration-white/70 underline-offset-2"
                onClick={onAction}
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
