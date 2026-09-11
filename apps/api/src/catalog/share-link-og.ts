import type { ShareLinkView } from '@ekum/domain-types';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function absoluteMediaUrl(image: string | null, mediaBase: string): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  const base = mediaBase.replace(/\/$/, '');
  return `${base}/${image.replace(/^\//, '')}`;
}

export function shareLinkOgCopy(view: ShareLinkView): { title: string; description: string } {
  const seller = view.companyName.trim() || 'A business';
  const what = view.kind === 'collection' ? 'collection' : 'design';
  const name = view.name.trim() || what;
  return {
    title: `${seller} · ${name}`,
    description: `${seller} shared a ${what} on Ekum — open to view.`,
  };
}

/** Crawler HTML: seller + name + teaser image. Humans still open the SPA `/s/:token`. */
export function shareLinkOgHtml(options: {
  view: ShareLinkView;
  pageUrl: string;
  imageUrl: string | null;
  fallbackImageUrl: string;
}): string {
  const { title, description } = shareLinkOgCopy(options.view);
  const image = options.imageUrl ?? options.fallbackImageUrl;
  const card = options.imageUrl ? 'summary_large_image' : 'summary';
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
