import { shortOrderLabel, type OrderItemView, type OrderShipmentView } from '@ekum/domain-types';
import { formatUnit } from '@/lib/format';

export type PackingSlipOptions = {
  /** Include “To: {buyer}”. Default true. */
  showBuyer?: boolean;
  /** Include design thumbs when fetchable. Default true. */
  showPhotos?: boolean;
};

export type PackingSlipInput = {
  orderId: string;
  counterpartName: string;
  shipment: OrderShipmentView;
  note?: string | null;
  orderItems?: OrderItemView[];
  options?: PackingSlipOptions;
};

/** Helvetica WinAnsi — keep printable ASCII; map common trade glyphs. */
function winAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u00B7\u2022\u2024]/g, '-')
    .replace(/\u20B9/g, 'Rs')
    .replace(/[^\x20-\x7E]/g, '?');
}

function pdfEscape(text: string): string {
  return winAnsi(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function slipDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function padRight(text: string, width: number): string {
  const t = winAnsi(text);
  if (t.length >= width) return t.slice(0, width);
  return `${t}${' '.repeat(width - t.length)}`;
}

function padLeft(text: string, width: number): string {
  const t = winAnsi(text);
  if (t.length >= width) return t.slice(0, width);
  return `${' '.repeat(width - t.length)}${t}`;
}

function resolveOptions(options?: PackingSlipOptions): Required<PackingSlipOptions> {
  return {
    showBuyer: options?.showBuyer !== false,
    showPhotos: options?.showPhotos !== false,
  };
}

export type PackingSlipRow = {
  /** Shipment qty in the order unit, e.g. "200 mtr". */
  quantity: string;
  name: string;
  sku: string;
  imageUrl: string | null;
};

/** Qty is always the shipment amount in the line’s order `unit` (not dispatch pcs). */
export function packingSlipRows(input: PackingSlipInput): PackingSlipRow[] {
  return input.shipment.items.map((row) => {
    const source = input.orderItems?.find((item) => item.id === row.orderItemId);
    const unit = source ? formatUnit(source.unit) : '';
    const qty = String(row.quantity);
    return {
      quantity: unit ? `${qty} ${unit}` : qty,
      name: row.name,
      sku: source?.sku?.trim() || '',
      imageUrl: source?.image?.trim() || source?.images?.[0]?.trim() || null,
    };
  });
}

/** LR / bill header lines for packing slip (legacy single LR fallback). */
export function packingSlipLegLines(
  shipment: Pick<OrderShipmentView, 'legs' | 'lrNumber'>,
): string[] {
  const legs = shipment.legs ?? [];
  if (legs.length > 0) {
    return legs
      .map((leg) => {
        const lr = leg.lrNumber?.trim() || '';
        const bill = leg.billNumber?.trim() || '';
        if (lr && bill) return `LR: ${lr}  Bill: ${bill}`;
        if (lr) return `LR: ${lr}`;
        if (bill) return `Bill: ${bill}`;
        return null;
      })
      .filter((line): line is string => Boolean(line));
  }
  const lr = shipment.lrNumber?.trim();
  return lr ? [`LR: ${lr}`] : [];
}

/** Plain text lines for tests / fallback — printable ASCII, full header. */
export function packingSlipLines(input: PackingSlipInput): string[] {
  const opts = resolveOptions(input.options);
  const order = shortOrderLabel(input.orderId);
  const when = slipDate(input.shipment.dispatchedAt);
  const lines = ['PACKING LIST', '', order];
  if (opts.showBuyer) lines.push(`To: ${input.counterpartName}`);
  lines.push(`Date: ${when}`);
  for (const legLine of packingSlipLegLines(input.shipment)) {
    lines.push(legLine);
  }
  if (input.shipment.transporter?.trim()) {
    lines.push(`Transporter: ${input.shipment.transporter.trim()}`);
  }
  if (input.shipment.parcelCount != null) {
    lines.push(`Parcels: ${input.shipment.parcelCount}`);
  }
  lines.push('', 'Qty        Design                         SKU');
  lines.push('-'.repeat(64));
  for (const row of packingSlipRows(input)) {
    lines.push(
      `${padLeft(row.quantity, 9)}  ${padRight(row.name, 30)} ${padRight(row.sku, 14)}`.trimEnd(),
    );
  }
  lines.push('-'.repeat(64));
  if (input.note?.trim()) {
    lines.push('', `Note: ${input.note.trim()}`);
  }
  return lines;
}

type DrawCmd = string;

function textAt(x: number, y: number, size: number, font: 'F1' | 'F2', text: string): DrawCmd[] {
  return [
    'BT',
    `/${font} ${size} Tf`,
    `${x} ${y} Td`,
    `(${pdfEscape(text)}) Tj`,
    'ET',
  ];
}

function rule(x1: number, y: number, x2: number): DrawCmd[] {
  return [`${x1} ${y} m`, `${x2} ${y} l`, 'S'];
}

type JpegThumb = {
  name: string;
  bytes: Uint8Array;
  width: number;
  height: number;
};

const THUMB = 36;

/**
 * Fetch design image and re-encode as a square JPEG thumb (works for PNG/WebP too).
 * CORS / missing → null (row still prints without a photo).
 */
export async function packingSlipJpegThumb(url: string): Promise<JpegThumb | null> {
  if (typeof document === 'undefined') return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = THUMB;
    canvas.height = THUMB;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return null;
    }
    const scale = Math.max(THUMB / bitmap.width, THUMB / bitmap.height);
    const dw = bitmap.width * scale;
    const dh = bitmap.height * scale;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, THUMB, THUMB);
    ctx.drawImage(bitmap, (THUMB - dw) / 2, (THUMB - dh) / 2, dw, dh);
    bitmap.close();
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82),
    );
    if (!jpeg) return null;
    const buf = new Uint8Array(await jpeg.arrayBuffer());
    return { name: 'Im', bytes: buf, width: THUMB, height: THUMB };
  } catch {
    return null;
  }
}

function concatPdfParts(parts: Array<string | Uint8Array>): Uint8Array {
  const encoded = parts.map((part) =>
    typeof part === 'string' ? new TextEncoder().encode(part) : part,
  );
  const total = encoded.reduce((n, part) => n + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of encoded) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/**
 * Printable packing list (A4). Optional buyer line + design thumbs.
 * Qty is shipment qty in the order unit.
 */
export async function packingSlipPdfBytes(input: PackingSlipInput): Promise<Uint8Array> {
  const opts = resolveOptions(input.options);
  const pageW = 595;
  const pageH = 842;
  const margin = 48;
  const contentW = pageW - margin * 2;
  const order = shortOrderLabel(input.orderId);
  const when = slipDate(input.shipment.dispatchedAt);
  const legLines = packingSlipLegLines(input.shipment);
  const transporter = input.shipment.transporter?.trim() || '';
  const parcels =
    input.shipment.parcelCount != null ? String(input.shipment.parcelCount) : '';
  const rows = packingSlipRows(input).slice(0, 22);

  const thumbs: Array<JpegThumb | null> = opts.showPhotos
    ? await Promise.all(rows.map((row) => (row.imageUrl ? packingSlipJpegThumb(row.imageUrl) : null)))
    : rows.map(() => null);

  const cmds: DrawCmd[] = [];
  let y = pageH - margin;

  cmds.push(...textAt(margin, y, 18, 'F2', 'PACKING LIST'));
  y -= 28;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 22;

  cmds.push(...textAt(margin, y, 12, 'F2', order));
  y -= 18;
  if (opts.showBuyer) {
    cmds.push(...textAt(margin, y, 11, 'F1', `To: ${input.counterpartName}`));
    y -= 16;
  }
  cmds.push(...textAt(margin, y, 11, 'F1', `Date: ${when}`));
  y -= 20;

  for (const legLine of legLines) {
    cmds.push(...textAt(margin, y, 11, 'F1', legLine));
    y -= 16;
  }
  const meta: string[] = [];
  if (transporter) meta.push(`Transporter: ${transporter}`);
  if (parcels) meta.push(`Parcels: ${parcels}`);
  if (meta.length > 0) {
    cmds.push(...textAt(margin, y, 11, 'F1', meta.join('    ')));
    y -= 22;
  } else if (legLines.length > 0) {
    y -= 6;
  }

  cmds.push(...rule(margin, y, margin + contentW));
  y -= 18;

  const hasAnyPhoto = thumbs.some(Boolean);
  const colPhoto = margin;
  const colQty = hasAnyPhoto ? margin + 44 : margin;
  const colName = colQty + 72;
  const colSku = margin + 400;

  cmds.push(...textAt(colQty, y, 10, 'F2', 'Qty'));
  cmds.push(...textAt(colName, y, 10, 'F2', 'Design'));
  cmds.push(...textAt(colSku, y, 10, 'F2', 'SKU'));
  y -= 8;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 14;

  const rowGap = hasAnyPhoto ? 44 : 18;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    const thumb = thumbs[i];
    if (y < margin + 80) break;
    const textY = thumb ? y - 14 : y;
    if (thumb) {
      const imgY = y - THUMB;
      cmds.push('q');
      cmds.push(`${THUMB} 0 0 ${THUMB} ${colPhoto} ${imgY} cm`);
      cmds.push(`/Im${i} Do`);
      cmds.push('Q');
    }
    cmds.push(...textAt(colQty, textY, 11, 'F2', row.quantity.slice(0, 12)));
    cmds.push(...textAt(colName, textY, 11, 'F1', row.name.slice(0, hasAnyPhoto ? 28 : 36)));
    if (row.sku) cmds.push(...textAt(colSku, textY, 10, 'F1', row.sku.slice(0, 16)));
    y -= rowGap;
  }

  y -= 4;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 20;

  const note = input.note?.trim();
  if (note && y > margin + 40) {
    cmds.push(...textAt(margin, y, 10, 'F2', 'Note'));
    y -= 14;
    const words = winAnsi(note).split(/\s+/);
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > 78) {
        cmds.push(...textAt(margin, y, 10, 'F1', line));
        y -= 13;
        line = word;
        if (y < margin + 24) break;
      } else {
        line = next;
      }
    }
    if (line && y >= margin + 24) {
      cmds.push(...textAt(margin, y, 10, 'F1', line));
      y -= 16;
    }
  }

  cmds.push(...textAt(margin, Math.max(margin, y - 8), 9, 'F1', 'Ekum'));

  const stream = cmds.join('\n');
  const streamBytes = new TextEncoder().encode(stream);

  // Object ids: 1 catalog, 2 pages, 3 page, 4 contents, 5 F1, 6 F2, 7+ images
  const imageObjs: Array<{ id: number; bytes: Uint8Array; w: number; h: number }> = [];
  let nextId = 7;
  for (let i = 0; i < thumbs.length; i += 1) {
    const thumb = thumbs[i];
    if (!thumb) continue;
    imageObjs.push({ id: nextId, bytes: thumb.bytes, w: thumb.width, h: thumb.height });
    // rewrite /Im{i} to actual object — content already uses /Im{i}
    nextId += 1;
  }

  // Map content image names Im0.. to object ids — rebuild xobject dict
  const imNameToId = new Map<string, number>();
  let imgIdx = 0;
  for (let i = 0; i < thumbs.length; i += 1) {
    if (!thumbs[i]) continue;
    imNameToId.set(`Im${i}`, imageObjs[imgIdx]!.id);
    imgIdx += 1;
  }

  let xobjects = '';
  for (const [name, id] of imNameToId) {
    xobjects += `/${name} ${id} 0 R `;
  }

  const pageResources = xobjects
    ? `/Font << /F1 5 0 R /F2 6 0 R >> /XObject << ${xobjects}>>`
    : `/Font << /F1 5 0 R /F2 6 0 R >>`;

  const enc = (s: string) => new TextEncoder().encode(s);
  const objectBins: Uint8Array[] = [
    enc('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n'),
    enc('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n'),
    enc(
      `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << ${pageResources} >> >> endobj\n`,
    ),
    concatPdfParts([
      enc(`4 0 obj << /Length ${streamBytes.length} >> stream\n`),
      streamBytes,
      enc('\nendstream endobj\n'),
    ]),
    enc('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n'),
    enc('6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n'),
  ];
  for (const img of imageObjs) {
    objectBins.push(
      concatPdfParts([
        enc(
          `${img.id} 0 obj << /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >> stream\n`,
        ),
        img.bytes,
        enc('\nendstream endobj\n'),
      ]),
    );
  }

  const built: Array<string | Uint8Array> = ['%PDF-1.4\n'];
  const objOffsets: number[] = [0];
  let cursor = enc('%PDF-1.4\n').length;
  for (const bin of objectBins) {
    objOffsets.push(cursor);
    built.push(bin);
    cursor += bin.length;
  }
  const xrefStart = cursor;
  let xref = `xref\n0 ${objectBins.length + 1}\n0000000000 65535 f \n`;
  for (let o = 1; o <= objectBins.length; o += 1) {
    xref += `${String(objOffsets[o]).padStart(10, '0')} 00000 n \n`;
  }
  built.push(xref);
  built.push(
    `trailer << /Size ${objectBins.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
  );
  return concatPdfParts(built);
}

export function packingSlipFileName(input: PackingSlipInput): string {
  const order = shortOrderLabel(input.orderId).replace(/\s+/g, '');
  const lr = input.shipment.lrNumber?.trim().replace(/[^\w-]+/g, '') || 'dispatch';
  return `${order}-${lr}.pdf`;
}

export async function shareOrDownloadPdf(file: File): Promise<'shared' | 'downloaded'> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };
  if (typeof nav.canShare === 'function' && nav.canShare({ files: [file] }) && nav.share) {
    await nav.share({ files: [file], title: file.name });
    return 'shared';
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

/**
 * Open packing slip in the phone / browser PDF viewer.
 * Falls back to download when a new tab is blocked.
 */
export function openPackingSlipPdf(file: File): 'opened' | 'downloaded' {
  const url = URL.createObjectURL(file);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'opened';
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.rel = 'noopener';
  link.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
