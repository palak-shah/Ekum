import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWA_UPDATE_MESSAGE = 'New version';
export const PWA_UPDATE_ACTION = 'Load';
/** Recheck while a tab stays open for a long session. */
export const PWA_UPDATE_CHECK_MS = 30 * 60 * 1000;

/** Bypass HTTP cache so a new `sw.js` on the server is seen (nginx/CDN). */
export async function refreshServiceWorker(
  registration: Pick<ServiceWorkerRegistration, 'update'>,
  swUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  try {
    await fetchImpl(swUrl, { cache: 'no-store' });
  } catch {
    // Offline — still ask the browser; it may have a waiting worker.
  }
  await registration.update();
}

export const WEB_BUILD_VERSION_URL = '/version.json';

export function clientWebBuild(): string {
  return import.meta.env.VITE_WEB_BUILD ?? '';
}

/** Home Screen and a Safari tab each run this — SW update alone is not enough on iOS. */
export async function remoteWebBuildIsNewer(
  fetchImpl: typeof fetch = fetch,
  localBuild: string = clientWebBuild(),
): Promise<boolean> {
  if (!localBuild) return false;
  try {
    const res = await fetchImpl(WEB_BUILD_VERSION_URL, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = (await res.json()) as { build?: unknown };
    return typeof data.build === 'string' && data.build.length > 0 && data.build !== localBuild;
  } catch {
    return false;
  }
}

function bindUpdateRechecks(check: () => void): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') check();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', check);
  window.addEventListener('online', check);
  const interval = window.setInterval(check, PWA_UPDATE_CHECK_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', check);
    window.removeEventListener('pageshow', check);
    window.removeEventListener('online', check);
    window.clearInterval(interval);
  };
}

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
  const [buildStale, setBuildStale] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      const check = () => {
        void refreshServiceWorker(registration, swUrl);
      };
      check();
      bindUpdateRechecks(check);
    },
  });

  useEffect(() => {
    const checkBuild = () => {
      void remoteWebBuildIsNewer().then(setBuildStale);
    };
    checkBuild();
    return bindUpdateRechecks(checkBuild);
  }, []);

  return (
    <PwaUpdateBar
      open={needRefresh || buildStale}
      onLoad={() => {
        if (needRefresh) {
          void updateServiceWorker(true);
          return;
        }
        window.location.reload();
      }}
    />
  );
}
