const INVITE_RETURN_KEY = 'ekum.inviteReturn';

/** Persist a post-login return path for invite / referral deep links. */
export function stashInviteReturn(path: string | null | undefined): void {
  if (!path || !path.startsWith('/r/')) return;
  try {
    sessionStorage.setItem(INVITE_RETURN_KEY, path);
  } catch {
    /* private mode / unavailable */
  }
}

export function clearInviteReturn(): void {
  try {
    sessionStorage.removeItem(INVITE_RETURN_KEY);
  } catch {
    /* ignore */
  }
}

export function peekInviteReturn(): string | null {
  try {
    const stored = sessionStorage.getItem(INVITE_RETURN_KEY);
    return stored?.startsWith('/r/') ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Resolve where to send the user after OTP / onboarding when they arrived via
 * an invite: location.state.from, ?invite=, or a prior stash.
 */
export function resolveInviteReturn(options: {
  from?: string | null;
  inviteParam?: string | null;
}): string | null {
  if (options.from?.startsWith('/r/')) {
    stashInviteReturn(options.from);
    return options.from;
  }
  if (options.inviteParam?.trim()) {
    const path = `/r/${options.inviteParam.trim()}`;
    stashInviteReturn(path);
    return path;
  }
  return peekInviteReturn();
}
