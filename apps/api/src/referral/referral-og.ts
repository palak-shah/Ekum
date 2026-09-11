import type { ReferralView } from '@ekum/domain-types';
import { absoluteMediaUrl } from '../catalog/share-link-og';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function referralInviteCopy(view: ReferralView): { title: string; description: string } {
  const business = view.referrer.name.trim() || 'A business';
  if (view.target) {
    const target = view.target.name.trim() || 'a business';
    return {
      title: `Ekum · ${business} introduces ${target}`,
      description: `${business} introduces ${target} on Ekum`,
    };
  }
  return {
    title: `Ekum · Connect with ${business}`,
    description: `${business} invites you to connect on Ekum`,
  };
}

/** Crawler HTML for WhatsApp / Facebook. Humans still open the SPA `/r/:token`. */
export function referralOgHtml(options: {
  view: ReferralView;
  pageUrl: string;
  mediaBase: string;
  fallbackImageUrl: string;
}): string {
  const { title, description } = referralInviteCopy(options.view);
  const logo = absoluteMediaUrl(options.view.referrer.logoUrl, options.mediaBase);
  const image =
    logo && /^https?:\/\//i.test(logo) ? logo : options.fallbackImageUrl;
  // Always large card so WhatsApp shows the image (logo or Ekum app icon).
  const card = 'summary_large_image';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Ekum" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(options.pageUrl)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
<meta name="twitter:card" content="${card}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<link rel="canonical" href="${escapeHtml(options.pageUrl)}" />
</head>
<body>
<p><a href="${escapeHtml(options.pageUrl)}">${escapeHtml(title)}</a></p>
</body>
</html>`;
}
