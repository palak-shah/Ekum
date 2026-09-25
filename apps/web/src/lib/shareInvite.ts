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

export type ShareHandoffResult = 'shared' | 'copied' | 'manual';

async function writeClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export async function shareOrCopyInvite(options: {
  url: string;
  title: string;
  text: string;
  /**
   * Open the OS share sheet when the browser can. Clipboard is only a last
   * resort (desktop / no share targets) — never the first path on a phone.
   * Pass `false` when `canNativeShare()` is false (embedded browsers often
   * expose `share()` that always rejects).
   */
  preferShareSheet?: boolean;
  /** When set, clipboard writes this (e.g. several 48h URLs) instead of `url` only. */
  copyText?: string;
}): Promise<ShareHandoffResult> {
  const { url, title, text } = options;
  const shouldShare =
    options.preferShareSheet !== false &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function';
  if (shouldShare) {
    try {
      await navigator.share(nativeShareFields({ title, text, url }));
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }
  if (await writeClipboard(options.copyText ?? url)) return 'copied';
  return 'manual';
}

/** True only when the OS share sheet is likely to accept this payload. */
export function canNativeShare(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return true;
  try {
    return navigator.canShare({ title: 'Ekum', text: 'Ekum' });
  } catch {
    return false;
  }
}

/** Branded share title/text so the clickable link doesn’t look like random spam. */
export function inviteShareCopy(options: {
  kind: 'connect' | 'vouch' | 'group';
  /** Inviter / referrer business name. */
  companyName: string;
  /** Targeted vouch recipient business. */
  targetName?: string;
  /** Group title when kind is group. */
  groupName?: string;
}): { title: string; text: string } {
  const business = options.companyName.trim() || 'A business';
  if (options.kind === 'group') {
    const group = options.groupName?.trim() || 'a group';
    return {
      title: `Ekum · Join ${group}`,
      text: `${business} invites you to ${group} on Ekum`,
    };
  }
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

/** Public shop URL for connections / WhatsApp. */
export function companyShareCopy(companyName: string): { title: string; text: string } {
  const name = companyName.trim() || 'A business';
  return {
    title: `${name} on Ekum`,
    text: `${name} on Ekum`,
  };
}

/** One clickable link. Do not attach a photo — messengers split image + URL. */
export function catalogShareCopy(options: {
  name: string;
  kind: 'collection' | 'product' | 'designs';
  companyName: string;
}): { title: string; text: string } {
  const seller = options.companyName.trim() || 'A business';
  const item =
    options.name.trim() ||
    (options.kind === 'collection'
      ? 'a collection'
      : options.kind === 'designs'
        ? 'designs'
        : 'a design');
  return {
    title: `${seller} · ${item}`,
    text:
      options.kind === 'designs'
        ? `${seller} shared designs on Ekum`
        : `${seller} shared ${item} on Ekum`,
  };
}
