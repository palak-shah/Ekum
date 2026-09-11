/** Pure layout helper for WhatsApp OG collage slots. */
export function layoutTeaserSlots(count: number): 'empty' | 'single' | 'dual' | 'triple' | 'quad' {
  if (count <= 0) return 'empty';
  if (count === 1) return 'single';
  if (count === 2) return 'dual';
  if (count === 3) return 'triple';
  return 'quad';
}

export type TeaserSlot = { left: number; top: number; width: number; height: number };

/** Pixel slots inside a 1200×630 canvas. */
export function teaserSlotRects(
  layout: Exclude<ReturnType<typeof layoutTeaserSlots>, 'empty'>,
): TeaserSlot[] {
  const W = 1200;
  const H = 630;
  const g = 8;
  if (layout === 'single') {
    return [{ left: 0, top: 0, width: W, height: H }];
  }
  if (layout === 'dual') {
    const w = Math.floor((W - g) / 2);
    return [
      { left: 0, top: 0, width: w, height: H },
      { left: w + g, top: 0, width: W - w - g, height: H },
    ];
  }
  if (layout === 'triple') {
    const leftW = Math.floor((W - g) / 2);
    const rightW = W - leftW - g;
    const h = Math.floor((H - g) / 2);
    return [
      { left: 0, top: 0, width: leftW, height: H },
      { left: leftW + g, top: 0, width: rightW, height: h },
      { left: leftW + g, top: h + g, width: rightW, height: H - h - g },
    ];
  }
  const w = Math.floor((W - g) / 2);
  const h = Math.floor((H - g) / 2);
  return [
    { left: 0, top: 0, width: w, height: h },
    { left: w + g, top: 0, width: W - w - g, height: h },
    { left: 0, top: h + g, width: w, height: H - h - g },
    { left: w + g, top: h + g, width: W - w - g, height: H - h - g },
  ];
}

/**
 * Build a blurred collage JPEG for messengers.
 * Soft blur matches gated chat album teaser language.
 */
export async function buildShareLinkOgJpeg(options: {
  imageBuffers: Buffer[];
  sellerLabel: string;
}): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  const W = 1200;
  const H = 630;
  const buffers = options.imageBuffers.slice(0, 4);
  const layout = layoutTeaserSlots(buffers.length);

  if (layout === 'empty') {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#2b2b2b"/>
      <text x="48" y="${H - 48}" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#ffffff">Ekum</text>
      <text x="48" y="80" font-family="system-ui,sans-serif" font-size="42" font-weight="600" fill="#f5f5f5">${escapeXml(options.sellerLabel || 'Ekum')}</text>
    </svg>`;
    return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
  }

  const slots = teaserSlotRects(layout);
  const composites: { input: Buffer; left: number; top: number }[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const src = buffers[i] ?? buffers[buffers.length - 1]!;
    const tile = await sharp(src)
      .rotate()
      .resize(slot.width, slot.height, { fit: 'cover', position: 'centre' })
      .blur(12)
      .modulate({ brightness: 0.92 })
      .jpeg({ quality: 80 })
      .toBuffer();
    composites.push({ input: tile, left: slot.left, top: slot.top });
  }

  const seller = escapeXml((options.sellerLabel || '').slice(0, 40));
  const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
        <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="40" y="${H - 36}" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#ffffff">Ekum</text>
    ${seller ? `<text x="40" y="${H - 78}" font-family="system-ui,sans-serif" font-size="32" font-weight="600" fill="#ffffff">${seller}</text>` : ''}
  </svg>`);

  return sharp({
    create: { width: W, height: H, channels: 3, background: '#1a1a1a' },
  })
    .jpeg()
    .composite([...composites, { input: overlay, left: 0, top: 0 }])
    .jpeg({ quality: 84 })
    .toBuffer();
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
