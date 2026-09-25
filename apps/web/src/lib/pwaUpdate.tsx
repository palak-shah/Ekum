import { createPortal } from 'react-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWA_UPDATE_MESSAGE = 'New version';
export const PWA_UPDATE_ACTION = 'Load';
/** Recheck while a tab stays open for a long session. */
export const PWA_UPDATE_CHECK_MS = 30 * 60 * 1000;

export function PwaUpdateBar({
  open,
  onLoad,
}: {
  open: boolean;
  onLoad: () => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-update-bar"
      className="fixed inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top))] z-[90] mx-auto flex max-w-md justify-center px-4"
    >
      <div className="flex max-w-full items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
        <p className="min-w-0">{PWA_UPDATE_MESSAGE}</p>
        <button
          type="button"
          className="shrink-0 underline decoration-white/70 underline-offset-2"
          onClick={onLoad}
        >
          {PWA_UPDATE_ACTION}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function PwaUpdateHost() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        void registration.update();
      };
      check();
      const onVisible = () => {
        if (document.visibilityState === 'visible') check();
      };
      document.addEventListener('visibilitychange', onVisible);
      window.setInterval(check, PWA_UPDATE_CHECK_MS);
    },
  });

  return (
    <PwaUpdateBar
      open={needRefresh}
      onLoad={() => {
        void updateServiceWorker(true);
      }}
    />
  );
}
