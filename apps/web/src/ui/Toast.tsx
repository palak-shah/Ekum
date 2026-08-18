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
import { cx } from '@/ui/kit';

type ToastTone = 'success' | 'danger';

interface ToastContextValue {
  /** Brief acknowledgement above the bottom nav (auto-dismiss). */
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), DISMISS_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="app-toast"
          className={cx(
            'pointer-events-none fixed inset-x-0 z-[70] mx-auto flex max-w-md justify-center px-4',
            'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]',
          )}
        >
          <p
            className={cx(
              'ekum-rise rounded-full px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-soft)]',
              toast.tone === 'danger'
                ? 'bg-danger text-white'
                : 'bg-ink text-white',
            )}
          >
            {toast.message}
          </p>
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
