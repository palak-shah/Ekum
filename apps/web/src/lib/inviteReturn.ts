const INVITE_RETURN_KEY = 'ekum.inviteReturn';

/** Persist a post-login return path for invite / referral deep links. */
export function stashInviteReturn(path: string | null | undefined): void {
  if (
    !path ||
    !(
      path.startsWith('/r/') ||
      path.startsWith('/o/') ||
      path.startsWith('/s/') ||
      path.startsWith('/t/')
    )
  )
    return;
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
    return stored &&
      (stored.startsWith('/r/') ||
        stored.startsWith('/o/') ||
        stored.startsWith('/s/') ||
        stored.startsWith('/t/'))
      ? stored
      : null;
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
  if (
    options.from?.startsWith('/r/') ||
    options.from?.startsWith('/o/') ||
    options.from?.startsWith('/s/') ||
    options.from?.startsWith('/t/')
  ) {
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
