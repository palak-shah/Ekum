import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useBlocker } from 'react-router-dom';
import { armDiscardLeaveBypass } from './discardLeaveBypass';

/**
 * Blocks route changes while `isActive` and offers Leave / Cancel confirm.
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
