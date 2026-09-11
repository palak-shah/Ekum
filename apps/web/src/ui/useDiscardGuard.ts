import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useBlocker } from 'react-router-dom';
import { armDiscardLeaveBypass } from './discardLeaveBypass';

/**
 * Blocks route changes while `isActive` and offers Leave / Cancel confirm.
 * Also arms the browser leave prompt on reload / pull-to-refresh / tab close
 * (native dialog — SPA sheet cannot run across a hard refresh).
 * Use `tryLeave` for explicit back buttons that do not go through the blocker.
 * Set `leaveBypassRef.current = true` (or call `allowLeave`) before intentional
 * navigation — e.g. successful submit — so the blocker does not intercept it.
 */
export function useDiscardGuard(
  isActive: boolean,
  leaveBypassRef?: RefObject<boolean>,
) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const internalBypassRef = useRef(false);
  const bypassRef = leaveBypassRef ?? internalBypassRef;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !bypassRef.current &&
      isActive &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setConfirmOpen(true);
    }
  }, [blocker.state]);

  // Hard refresh / pull-to-refresh / close tab — cannot show our sheet.
  useEffect(() => {
    if (!isActive) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    // Reduce accidental pull-to-refresh while WIP (Safari / Chrome Android).
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehaviorY;
    const prevBody = body.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = 'none';
    body.style.overscrollBehaviorY = 'none';

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      html.style.overscrollBehaviorY = prevHtml;
      body.style.overscrollBehaviorY = prevBody;
    };
  }, [isActive, bypassRef]);

  const cancelLeave = useCallback(() => {
    setConfirmOpen(false);
    pendingActionRef.current = null;
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  const confirmLeave = useCallback(() => {
    setConfirmOpen(false);
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) {
      // Back/header Leave path: pending calls navigate(). Without bypass the
      // route blocker would show this sheet a second time.
      armDiscardLeaveBypass(bypassRef);
      pending();
      return;
    }
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker, bypassRef]);

  const tryLeave = useCallback(
    (action: () => void) => {
      if (!isActive) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setConfirmOpen(true);
    },
    [isActive],
  );

  const allowLeave = useCallback(() => {
    armDiscardLeaveBypass(bypassRef);
  }, [bypassRef]);

  return {
    confirmOpen,
    cancelLeave,
    confirmLeave,
    tryLeave,
    allowLeave,
  };
}
