import type { QueryClient } from '@tanstack/react-query';
import { BUSINESS_SHOWCASE_MAX } from '@ekum/domain-types';
import { uploadImage } from '@/lib/mediaUpload';
import { patchProfileMedia } from './profileMedia';
import { appendShowcaseUrls, showcaseSlotsLeft } from './showcaseUrls';

export type ShowcasePendingTile = {
  id: string;
  previewUrl: string;
};

type ToastFn = (message: string, kind: 'danger') => void;

type Session = {
  pending: ShowcasePendingTile[];
  /** True while at least one file in this company queue is uploading. */
  uploading: boolean;
  /**
   * Authoritative list while a queue is running — survives React stale props
   * after sheet close / before invalidate settles.
   */
  workingUrls: string[] | null;
  listeners: Set<() => void>;
  /** Serialize batches so PATCH order stays stable across sheet close/reopen. */
  chain: Promise<void>;
};

const sessions = new Map<string, Session>();

function ensure(companyId: string): Session {
  let session = sessions.get(companyId);
  if (!session) {
    session = {
      pending: [],
      uploading: false,
      workingUrls: null,
      listeners: new Set(),
      chain: Promise.resolve(),
    };
    sessions.set(companyId, session);
  }
  return session;
}

function notify(session: Session) {
  for (const listener of session.listeners) listener();
}

export function subscribeShowcaseUploadSession(
  companyId: string,
  listener: () => void,
): () => void {
  const session = ensure(companyId);
  session.listeners.add(listener);
  return () => {
    session.listeners.delete(listener);
  };
}

export function getShowcasePending(companyId: string): ShowcasePendingTile[] {
  return ensure(companyId).pending;
}

export function isShowcaseUploading(companyId: string): boolean {
  return ensure(companyId).uploading;
}

/** Test-only: clear in-flight session state between unit cases. */
export function resetShowcaseUploadSessionForTests() {
  for (const session of sessions.values()) {
    for (const tile of session.pending) {
      if (tile.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(tile.previewUrl);
        } catch {
          /* ignore */
        }
      }
    }
  }
  sessions.clear();
}

/**
 * Progressive Showcase upload. Survives browse-sheet close: network + PATCH
 * continue; reopen still shows pending tiles via subscribe.
 */
export function enqueueShowcaseUploads(
  companyId: string,
  files: File[],
  {
    queryClient,
    getUrls,
    onToast,
    max = BUSINESS_SHOWCASE_MAX,
  }: {
    queryClient: QueryClient;
    getUrls: () => string[];
    onToast: ToastFn;
    max?: number;
  },
): void {
  if (files.length < 1) return;
  const session = ensure(companyId);
  const base = session.workingUrls ?? getUrls();
  const occupied = base.length + session.pending.length;
  const slots = showcaseSlotsLeft(occupied, max);
  if (slots < 1) return;
  const batch = files.slice(0, slots);

  const tiles: ShowcasePendingTile[] = batch.map((file, index) => {
    let previewUrl = '';
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        previewUrl = URL.createObjectURL(file);
      }
    } catch {
      previewUrl = '';
    }
    return {
      id: `pending-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      previewUrl,
    };
  });
  session.pending = [...session.pending, ...tiles];
  session.uploading = true;
  notify(session);

  session.chain = session.chain
    .then(async () => {
      let working = [...(session.workingUrls ?? getUrls())];
      session.workingUrls = working;
      let ok = 0;
      let failed = 0;

      for (let i = 0; i < batch.length; i += 1) {
        const file = batch[i]!;
        const tile = tiles[i]!;
        try {
          const url = await uploadImage(file);
          if (!url) {
            failed += 1;
          } else {
            working = appendShowcaseUrls(working, [url], max);
            session.workingUrls = working;
            await patchProfileMedia(queryClient, companyId, { showcaseUrls: working });
            ok += 1;
          }
        } catch {
          failed += 1;
        } finally {
          session.pending = session.pending.filter((item) => item.id !== tile.id);
          if (tile.previewUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(tile.previewUrl);
            } catch {
              /* ignore */
            }
          }
          notify(session);
        }
      }

      if (failed > 0) {
        onToast(
          ok > 0
            ? `${ok} photo${ok === 1 ? '' : 's'} added; ${failed} failed.`
            : 'Could not upload photos.',
          'danger',
        );
      }
    })
    .catch(() => {
      /* keep queue alive after unexpected rejection */
    })
    .finally(() => {
      if (session.pending.length === 0) {
        session.uploading = false;
        session.workingUrls = null;
      } else {
        session.uploading = true;
      }
      notify(session);
    });
}
