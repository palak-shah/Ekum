/**
 * Share an invite as one clickable link (title + text + url in body).
 * Do not attach a PNG — messengers send images as separate non-clickable media.
 * Branding on the link itself comes from Open Graph tags on the public site.
 */

/** WhatsApp/Windows often drop the Share `url` field — the body must contain it. */
export function shareMessageText(text: string, url: string): string {
  if (text.includes(url)) return text;
  return text ? `${text}\n${url}` : url;
}

/**
 * Build navigator.share() fields. When the URL is already in `text`, omit `url`
 * so WhatsApp does not paste the link twice.
 */
export function nativeShareFields(options: {
  title: string;
  text: string;
  url: string;
}): ShareData {
  const message = shareMessageText(options.text, options.url);
  if (message.includes(options.url)) {
    return { title: options.title, text: message };
  }
  return { title: options.title, text: message, url: options.url };
}

export async function shareOrCopyInvite(options: {
  url: string;
  title: string;
  text: string;
}): Promise<'shared' | 'copied'> {
  const { url, title, text } = options;
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(nativeShareFields({ title, text, url }));
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
  kind: 'connect' | 'vouch';
  /** Inviter / referrer business name. */
  companyName: string;
  /** Targeted vouch recipient business. */
  targetName?: string;
}): { title: string; text: string } {
  const business = options.companyName.trim() || 'A business';
  if (options.kind === 'vouch' && options.targetName?.trim()) {
    const target = options.targetName.trim();
    return {
      title: `Ekum · ${business} introduces ${target}`,
      text: `${business} introduces ${target} on Ekum`,
    };
  }
  return {
    title: `Ekum · Connect with ${business}`,
    text: `${business} invites you to connect on Ekum`,
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
