import { shortOrderLabel, type OrderItemView, type OrderShipmentView } from '@ekum/domain-types';
import { dispatchLineKindLine } from './dispatchSheet';

export type PackingSlipInput = {
  orderId: string;
  counterpartName: string;
  shipment: OrderShipmentView;
  note?: string | null;
  orderItems?: OrderItemView[];
};

function winAnsi(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '?');
}

function pdfEscape(text: string): string {
  return winAnsi(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function packingSlipLines(input: PackingSlipInput): string[] {
  const order = shortOrderLabel(input.orderId);
  const lr = input.shipment.lrNumber?.trim()
    ? `LR ${input.shipment.lrNumber.trim()}`
    : 'Dispatch';
  const when = input.shipment.dispatchedAt.slice(0, 10);
  const lines = [
    'Ekum packing list',
    `${order} · ${lr}`,
    `With ${input.counterpartName}`,
    when,
    '',
    ...input.shipment.items.map((row) => {
      const source = input.orderItems?.find((item) => item.id === row.orderItemId);
      const kind = source ? dispatchLineKindLine(source) : null;
      return kind ? `${row.name} · ${kind}  x ${row.quantity}` : `${row.name}  x ${row.quantity}`;
    }),
  ];
  if (input.shipment.transporter) lines.push('', `Transporter ${input.shipment.transporter}`);
  if (input.note?.trim()) lines.push('', input.note.trim());
  return lines;
}

/** Minimal one-page PDF (Helvetica). Share/download — no extra library. */
export function packingSlipPdfBytes(input: PackingSlipInput): Uint8Array {
  const rows = packingSlipLines(input).slice(0, 40);
  const commands: string[] = ['BT', '/F1 12 Tf', '50 800 Td'];
  rows.forEach((row, index) => {
    if (index > 0) commands.push('0 -18 Td');
    commands.push(`(${pdfEscape(row)}) Tj`);
  });
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
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
