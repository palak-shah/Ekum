import { useEffect, useState } from 'react';
import {
  formatApiErrorDebug,
  getApiErrorDebug,
  setApiErrorDebug,
  subscribeApiErrorDebug,
} from '@/lib/apiErrorDebugStore';
import type { ApiErrorLogPayload } from '@/lib/apiErrorLog';
import { isEkumDebug } from '@/lib/ekumDebug';

/**
 * On-screen API error dump when `isEkumDebug()` is true. Hidden for traders.
 */
export function DebugApiErrorPanel() {
  const [payload, setPayload] = useState<ApiErrorLogPayload | null>(() =>
    isEkumDebug() ? getApiErrorDebug() : null,
  );

  useEffect(() => {
    if (!isEkumDebug()) return;
    return subscribeApiErrorDebug(setPayload);
  }, []);

  if (!isEkumDebug() || !payload) return null;

  return (
    <div
      role="alert"
      data-testid="debug-api-error"
      className="fixed inset-x-0 top-0 z-[100] mx-auto max-w-md border-b border-danger/40 bg-ink/95 px-3 py-2 text-left text-[11px] leading-snug text-white shadow-[var(--shadow-soft)]"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-bold tracking-tight text-tangerine">Debug · API error</p>
        <button
          type="button"
          className="rounded px-2 py-0.5 font-bold text-white/80 hover:bg-white/10"
          onClick={() => setApiErrorDebug(null)}
        >
          Dismiss
        </button>
      </div>
      <pre className="ekum-no-scrollbar max-h-[40vh] overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-white/90">
        {formatApiErrorDebug(payload)}
      </pre>
    </div>
  );
}
