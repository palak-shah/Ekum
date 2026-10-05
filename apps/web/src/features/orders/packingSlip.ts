import { shortOrderLabel, type OrderItemView, type OrderShipmentView } from '@ekum/domain-types';
import { formatUnit } from '@/lib/format';

export type PackingSlipInput = {
  orderId: string;
  counterpartName: string;
  shipment: OrderShipmentView;
  note?: string | null;
  orderItems?: OrderItemView[];
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

export type PackingSlipRow = {
  quantity: string;
  name: string;
  sku: string;
  unit: string;
};

export function packingSlipRows(input: PackingSlipInput): PackingSlipRow[] {
  return input.shipment.items.map((row) => {
    const source = input.orderItems?.find((item) => item.id === row.orderItemId);
    return {
      quantity: String(row.quantity),
      name: row.name,
      sku: source?.sku?.trim() || '',
      unit: source ? formatUnit(source.unit) || '' : '',
    };
  });
}

/** Plain text lines for tests / fallback — printable ASCII, full header. */
export function packingSlipLines(input: PackingSlipInput): string[] {
  const order = shortOrderLabel(input.orderId);
  const lr = input.shipment.lrNumber?.trim() || '';
  const when = slipDate(input.shipment.dispatchedAt);
  const lines = [
    'PACKING LIST',
    '',
    order,
    `To: ${input.counterpartName}`,
    `Date: ${when}`,
  ];
  if (lr) lines.push(`LR: ${lr}`);
  if (input.shipment.transporter?.trim()) {
    lines.push(`Transporter: ${input.shipment.transporter.trim()}`);
  }
  if (input.shipment.parcelCount != null) {
    lines.push(`Parcels: ${input.shipment.parcelCount}`);
  }
  lines.push('', 'Qty   Design                         SKU            Unit');
  lines.push('-'.repeat(64));
  for (const row of packingSlipRows(input)) {
    lines.push(
      `${padLeft(row.quantity, 4)}  ${padRight(row.name, 30)} ${padRight(row.sku, 14)} ${padRight(row.unit, 8)}`.trimEnd(),
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

/**
 * Printable one-page packing list (A4, Helvetica).
 * No extra library — title, party, LR block, qty table, note.
 */
export function packingSlipPdfBytes(input: PackingSlipInput): Uint8Array {
  const pageW = 595;
  const pageH = 842;
  const margin = 48;
  const contentW = pageW - margin * 2;
  const order = shortOrderLabel(input.orderId);
  const when = slipDate(input.shipment.dispatchedAt);
  const lr = input.shipment.lrNumber?.trim() || '';
  const transporter = input.shipment.transporter?.trim() || '';
  const parcels =
    input.shipment.parcelCount != null ? String(input.shipment.parcelCount) : '';
  const rows = packingSlipRows(input).slice(0, 28);

  const cmds: DrawCmd[] = [];
  let y = pageH - margin;

  cmds.push(...textAt(margin, y, 18, 'F2', 'PACKING LIST'));
  y -= 28;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 22;

  cmds.push(...textAt(margin, y, 12, 'F2', order));
  y -= 18;
  cmds.push(...textAt(margin, y, 11, 'F1', `To: ${input.counterpartName}`));
  y -= 16;
  cmds.push(...textAt(margin, y, 11, 'F1', `Date: ${when}`));
  y -= 20;

  const meta: string[] = [];
  if (lr) meta.push(`LR: ${lr}`);
  if (transporter) meta.push(`Transporter: ${transporter}`);
  if (parcels) meta.push(`Parcels: ${parcels}`);
  if (meta.length > 0) {
    cmds.push(...textAt(margin, y, 11, 'F1', meta.join('    ')));
    y -= 22;
  }

  cmds.push(...rule(margin, y, margin + contentW));
  y -= 18;

  const colQty = margin;
  const colName = margin + 42;
  const colSku = margin + 320;
  const colUnit = margin + 460;

  cmds.push(...textAt(colQty, y, 10, 'F2', 'Qty'));
  cmds.push(...textAt(colName, y, 10, 'F2', 'Design'));
  cmds.push(...textAt(colSku, y, 10, 'F2', 'SKU'));
  cmds.push(...textAt(colUnit, y, 10, 'F2', 'Unit'));
  y -= 8;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 16;

  for (const row of rows) {
    if (y < margin + 80) break;
    cmds.push(...textAt(colQty, y, 11, 'F1', row.quantity));
    cmds.push(...textAt(colName, y, 11, 'F1', row.name.slice(0, 36)));
    if (row.sku) cmds.push(...textAt(colSku, y, 10, 'F1', row.sku.slice(0, 16)));
    if (row.unit) cmds.push(...textAt(colUnit, y, 10, 'F1', row.unit.slice(0, 10)));
    y -= 18;
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
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += `${obj}\n`;
  }
  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += xref;
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(body);
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
