/** Keep chat timeline pinned to newest unless the user scrolls up. */

export function isNearBottom(
  list: Pick<HTMLDivElement, 'scrollHeight' | 'scrollTop' | 'clientHeight'>,
  threshold = 96,
): boolean {
  return list.scrollHeight - list.scrollTop - list.clientHeight < threshold;
}

export type BottomScrollHandle = { cancel: () => void };

/**
 * Scroll to bottom on the next frames, but abort if `shouldStick` becomes false
 * (user scrolled up) — avoids the common race where a pending rAF yanks the
 * list back down after the trader started reading older messages.
 */
export function scrollListToBottom(
  list: HTMLDivElement,
  opts?: { shouldStick?: () => boolean },
): BottomScrollHandle {
  const shouldStick = opts?.shouldStick ?? (() => true);
  let cancelled = false;
  let outer = 0;
  let inner = 0;

  outer = requestAnimationFrame(() => {
    if (cancelled || !shouldStick()) return;
    list.scrollTop = list.scrollHeight;
    inner = requestAnimationFrame(() => {
      if (cancelled || !shouldStick()) return;
      list.scrollTop = list.scrollHeight;
    });
  });

  return {
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    },
  };
}

/**
 * Latch for chat stick-to-bottom.
 * - Scrolling away from bottom → unpin (stay unpinned through refetches / layout).
 * - Only a *user* scroll back to the bottom re-pins (not programmatic / clamp).
 */
export function createStickLatch(initial = true) {
  let stuck = initial;
  let programmatic = 0;
  let userDriven = false;

  return {
    isStuck: () => stuck,
    pin: () => {
      stuck = true;
    },
    unpin: () => {
      stuck = false;
    },
    setUserDriven: (value: boolean) => {
      userDriven = value;
    },
    beginProgrammatic: () => {
      programmatic += 1;
    },
    endProgrammatic: () => {
      programmatic = Math.max(0, programmatic - 1);
    },
    isProgrammatic: () => programmatic > 0,
    /** Call from the list `scroll` listener. Returns whether stick changed. */
    onScroll: (nearBottom: boolean): 'pinned' | 'unpinned' | 'unchanged' => {
      if (programmatic > 0) return 'unchanged';
      if (!nearBottom) {
        if (!stuck) return 'unchanged';
        stuck = false;
        return 'unpinned';
      }
      if (userDriven && !stuck) {
        stuck = true;
        return 'pinned';
      }
      return 'unchanged';
    },
  };
}

export type StickLatch = ReturnType<typeof createStickLatch>;
