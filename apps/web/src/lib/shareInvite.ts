/**
 * Share an invite as one clickable link (title + text + url).
 * Do not attach a PNG — messengers send images as separate non-clickable media.
 * Branding on the link itself comes from Open Graph tags on the public site.
 */

export async function shareOrCopyInvite(options: {
  url: string;
  title: string;
  text: string;
}): Promise<'shared' | 'copied'> {
  const { url, title, text } = options;
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Branded share title/text so the clickable link doesn’t look like random spam. */
export function inviteShareCopy(options: {
  url: string;
  kind: 'connect' | 'vouch';
  targetName?: string;
}): { title: string; text: string } {
  if (options.kind === 'vouch' && options.targetName) {
    return {
      title: 'Ekum — referral',
      text: `Request to connect on Ekum — referral for ${options.targetName}`,
    };
  }
  return {
    title: 'Ekum — connect with me',
    text: 'Request to connect on Ekum',
  };
}
