import { shortOrderLabel, type OrderItemView, type OrderShipmentView } from '@ekum/domain-types';
import {
  formatDualQty,
  formatPackingSlipTotal,
} from '@/features/orders/orderLineBilling';
import {
  PDF_A4,
  PDF_THUMB_PX,
  assembleHelveticaA4,
  jpegThumb,
  padLeft,
  padRight,
  pdfDate,
  rule,
  textAt,
  wrapPdfWords,
  type PdfDrawCmd,
  type PdfJpegThumb,
} from '@/features/orders/tradePdf';

export {
  jpegThumb as packingSlipJpegThumb,
  openTradePdf as openPackingSlipPdf,
  shareOrDownloadPdf,
} from '@/features/orders/tradePdf';

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

function packingSlipShipmentLines(input: PackingSlipInput) {
  const orderIndex = new Map((input.orderItems ?? []).map((item, i) => [item.id, i]));
  return [...input.shipment.items].sort((a, b) => {
    const ai = orderIndex.get(a.orderItemId) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.get(b.orderItemId) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

/** Qty in order unit; dual only when pack converts (not 1:1). Ticket order. */
export function packingSlipRows(input: PackingSlipInput): PackingSlipRow[] {
  return packingSlipShipmentLines(input).map((row) => {
    const source = input.orderItems?.find((item) => item.id === row.orderItemId);
    const quantity = source
      ? formatDualQty({
          quantity: row.quantity,
          unit: source.unit,
          piecesPerPack: source.piecesPerPack,
          dispatchUnit: source.dispatchUnit,
        })
      : String(row.quantity);
    return {
      quantity,
      name: row.name,
      sku: source?.sku?.trim() || '',
      imageUrl: source?.image?.trim() || source?.images?.[0]?.trim() || null,
    };
  });
}

export function packingSlipTotalLine(input: PackingSlipInput): string | null {
  const lines = packingSlipShipmentLines(input).map((row) => {
    const source = input.orderItems?.find((item) => item.id === row.orderItemId);
    return {
      quantity: row.quantity,
      unit: source?.unit ?? null,
      piecesPerPack: source?.piecesPerPack ?? null,
      dispatchUnit: source?.dispatchUnit ?? null,
    };
  });
  return formatPackingSlipTotal({ lines });
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
  const when = pdfDate(input.shipment.dispatchedAt);
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
      `${padLeft(row.quantity, 22)}  ${padRight(row.name, 24)} ${padRight(row.sku, 12)}`.trimEnd(),
    );
  }
  lines.push('-'.repeat(64));
  const total = packingSlipTotalLine(input);
  if (total) lines.push(total);
  if (input.note?.trim()) {
    lines.push('', `Note: ${input.note.trim()}`);
  }
  return lines;
}

/**
 * Printable packing list (A4). Optional buyer line + design thumbs.
 * Qty is shipment qty in the order unit.
 */
export async function packingSlipPdfBytes(input: PackingSlipInput): Promise<Uint8Array> {
  const opts = resolveOptions(input.options);
  const { pageW, pageH, margin } = PDF_A4;
  const contentW = pageW - margin * 2;
  const order = shortOrderLabel(input.orderId);
  const when = pdfDate(input.shipment.dispatchedAt);
  const legLines = packingSlipLegLines(input.shipment);
  const transporter = input.shipment.transporter?.trim() || '';
  const parcels =
    input.shipment.parcelCount != null ? String(input.shipment.parcelCount) : '';
  const rows = packingSlipRows(input).slice(0, 22);

  const thumbs: Array<PdfJpegThumb | null> = opts.showPhotos
    ? await Promise.all(rows.map((row) => (row.imageUrl ? jpegThumb(row.imageUrl) : null)))
    : rows.map(() => null);

  const cmds: PdfDrawCmd[] = [];
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
  const colName = colQty + 118;
  const colSku = margin + 420;

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
      const imgY = y - PDF_THUMB_PX;
      cmds.push('q');
      cmds.push(`${PDF_THUMB_PX} 0 0 ${PDF_THUMB_PX} ${colPhoto} ${imgY} cm`);
      cmds.push(`/Im${i} Do`);
      cmds.push('Q');
    }
    cmds.push(...textAt(colQty, textY, 10, 'F2', row.quantity.slice(0, 28)));
    cmds.push(...textAt(colName, textY, 11, 'F1', row.name.slice(0, hasAnyPhoto ? 22 : 30)));
    if (row.sku) cmds.push(...textAt(colSku, textY, 10, 'F1', row.sku.slice(0, 14)));
    y -= rowGap;
  }

  y -= 4;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 18;
  const totalLine = packingSlipTotalLine(input);
  if (totalLine && y > margin + 40) {
    cmds.push(...textAt(margin, y, 11, 'F2', totalLine.slice(0, 70)));
    y -= 20;
  }

  const note = input.note?.trim();
  if (note && y > margin + 40) {
    cmds.push(...textAt(margin, y, 10, 'F2', 'Note'));
    y -= 14;
    for (const line of wrapPdfWords(note, 78)) {
      if (y < margin + 24) break;
      cmds.push(...textAt(margin, y, 10, 'F1', line));
      y -= 13;
    }
    y -= 3;
  }

  cmds.push(...textAt(margin, Math.max(margin, y - 8), 9, 'F1', 'Ekum'));
  return assembleHelveticaA4(cmds, thumbs);
}

export function packingSlipFileName(input: PackingSlipInput): string {
  const order = shortOrderLabel(input.orderId).replace(/\s+/g, '');
  const lr = input.shipment.lrNumber?.trim().replace(/[^\w-]+/g, '') || 'dispatch';
  return `${order}-${lr}.pdf`;
}
