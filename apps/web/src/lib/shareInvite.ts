/**
 * Share an invite as one clickable link (title + text + url).
 * Do not attach a PNG — messengers send images as separate non-clickable media.
 * Branding on the link itself comes from Open Graph tags on the public site.
 */

/** WhatsApp/Windows often drop the Share `url` field — the body must contain it. */
export function shareMessageText(text: string, url: string): string {
  if (text.includes(url)) return text;
  return text ? `${text}\n${url}` : url;
}

export async function shareOrCopyInvite(options: {
  url: string;
  title: string;
  text: string;
}): Promise<'shared' | 'copied'> {
  const { url, title, text } = options;
  const message = shareMessageText(text, url);
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: message, url });
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

/** One clickable link. Do not attach a photo — messengers split image + URL. */
export function catalogShareCopy(options: {
  name: string;
  kind: 'collection' | 'product';
}): { title: string; text: string } {
  const what = options.kind === 'collection' ? 'collection' : 'design';
  return {
    title: `Ekum · ${options.name}`,
    text: `${options.name} on Ekum — this ${what}`,
  };
}
