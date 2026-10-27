import { lineBillAmount, shortOrderLabel, type OrderItemView } from '@ekum/domain-types';
import { formatOrderQty } from '@/features/orders/orderLineBilling';
import { orderRateText, ticketTotalSummary } from '@/features/orders/howManyLineMeta';
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

export type OrderFormOptions = {
  /** Include design thumbs when fetchable. Default true. */
  showPhotos?: boolean;
};

export type OrderFormInput = {
  orderId: string;
  intent?: string | null;
  createdAt: string;
  sellerName: string;
  buyerName: string;
  manualOrderNo?: string | null;
  note?: string | null;
  items: OrderItemView[];
  options?: OrderFormOptions;
};

export type OrderFormRow = {
  quantity: string;
  name: string;
  rate: string;
  bill: string;
  imageUrl: string | null;
  cantSupply: boolean;
};

function isInquiry(intent?: string | null): boolean {
  return intent === 'inquiry';
}

function formTitle(intent?: string | null): 'INQUIRY' | 'ORDER FORM' {
  return isInquiry(intent) ? 'INQUIRY' : 'ORDER FORM';
}

function resolveOptions(options?: OrderFormOptions): Required<OrderFormOptions> {
  return { showPhotos: options?.showPhotos !== false };
}

function formatBill(amount: number | null): string {
  if (amount == null) return '';
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Rows in ticket order. Qty is the order unit. Can’t-supply stays on the form. */
export function orderFormRows(input: OrderFormInput): OrderFormRow[] {
  return input.items.map((item) => {
    const cantSupply = item.lineStatus === 'declined';
    const bill = cantSupply
      ? null
      : lineBillAmount({
          quantity: item.quantity,
          rate: item.rate,
          unit: item.unit,
          piecesPerPack: item.piecesPerPack,
        });
    return {
      quantity: cantSupply
        ? "Can't supply"
        : formatOrderQty({ quantity: item.quantity, unit: item.unit }),
      name: item.name,
      rate: cantSupply
        ? ''
        : orderRateText({
            rate: item.rate,
            unit: item.unit,
            dispatchUnit: item.dispatchUnit,
            catalogRateUnit: item.catalogRateUnit,
          }) ?? '',
      bill: formatBill(bill),
      imageUrl: item.image?.trim() || item.images?.[0]?.trim() || null,
      cantSupply,
    };
  });
}

/** Ticket mill-bill Total lines (qty + ₹ of billable remaining). */
export function orderFormTotalLines(input: OrderFormInput): string[] {
  const summary = ticketTotalSummary(input.items);
  if (!summary) return [];
  const lines: string[] = [];
  summary.units.forEach((row, index) => {
    const prefix = index === 0 ? 'Total ' : '';
    const money = row.money ? `  ${row.money}` : '';
    lines.push(`${prefix}${row.qty}${money}`.trim());
  });
  if (summary.grand) lines.push(`All ${summary.grand}`);
  if (summary.missingCue) lines.push(`+${summary.missingCue}`);
  return lines;
}

/** Plain text lines for tests / fallback — both shops always print. */
export function orderFormLines(input: OrderFormInput): string[] {
  const title = formTitle(input.intent);
  const order = shortOrderLabel(input.orderId, { inquiry: isInquiry(input.intent) });
  const when = pdfDate(input.createdAt);
  const lines = [title, '', order, `Date: ${when}`];
  const manual = input.manualOrderNo?.trim();
  if (manual) lines.push(`No: ${manual}`);
  lines.push(`From: ${input.sellerName}`);
  lines.push(`To: ${input.buyerName}`);
  lines.push('', 'Qty            Design                    Rate          Bill');
  lines.push('-'.repeat(72));
  for (const row of orderFormRows(input)) {
    lines.push(
      `${padLeft(row.quantity, 14)}  ${padRight(row.name, 22)} ${padRight(row.rate, 13)} ${padLeft(row.bill, 12)}`.trimEnd(),
    );
  }
  lines.push('-'.repeat(72));
  for (const total of orderFormTotalLines(input)) {
    lines.push(total);
  }
  if (input.note?.trim()) {
    lines.push('', `Note: ${input.note.trim()}`);
  }
  return lines;
}

/**
 * Agreed ticket form (A4). Not an invoice. Not a packing list.
 * Qty = order unit; ₹ = Rate per; Total = ticket mill-bill.
 */
export async function orderFormPdfBytes(input: OrderFormInput): Promise<Uint8Array> {
  const opts = resolveOptions(input.options);
  const { pageW, pageH, margin } = PDF_A4;
  const contentW = pageW - margin * 2;
  const title = formTitle(input.intent);
  const order = shortOrderLabel(input.orderId, { inquiry: isInquiry(input.intent) });
  const when = pdfDate(input.createdAt);
  const rows = orderFormRows(input).slice(0, 22);

  const thumbs: Array<PdfJpegThumb | null> = opts.showPhotos
    ? await Promise.all(rows.map((row) => (row.imageUrl ? jpegThumb(row.imageUrl) : null)))
    : rows.map(() => null);

  const cmds: PdfDrawCmd[] = [];
  let y = pageH - margin;

  cmds.push(...textAt(margin, y, 18, 'F2', title));
  y -= 28;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 22;

  cmds.push(...textAt(margin, y, 12, 'F2', order));
  y -= 16;
  cmds.push(...textAt(margin, y, 11, 'F1', `Date: ${when}`));
  y -= 16;
  const manual = input.manualOrderNo?.trim();
  if (manual) {
    cmds.push(...textAt(margin, y, 11, 'F1', `No: ${manual}`));
    y -= 16;
  }
  cmds.push(...textAt(margin, y, 11, 'F1', `From: ${input.sellerName}`));
  y -= 16;
  cmds.push(...textAt(margin, y, 11, 'F1', `To: ${input.buyerName}`));
  y -= 20;

  cmds.push(...rule(margin, y, margin + contentW));
  y -= 18;

  const hasAnyPhoto = thumbs.some(Boolean);
  const colPhoto = margin;
  const colQty = hasAnyPhoto ? margin + 44 : margin;
  const colName = colQty + 88;
  const colRate = margin + 330;
  const colBill = margin + 430;

  cmds.push(...textAt(colQty, y, 10, 'F2', 'Qty'));
  cmds.push(...textAt(colName, y, 10, 'F2', 'Design'));
  cmds.push(...textAt(colRate, y, 10, 'F2', 'Rate'));
  cmds.push(...textAt(colBill, y, 10, 'F2', 'Bill'));
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
    cmds.push(...textAt(colQty, textY, 10, 'F2', row.quantity.slice(0, 16)));
    cmds.push(...textAt(colName, textY, 11, 'F1', row.name.slice(0, hasAnyPhoto ? 18 : 24)));
    if (row.rate) cmds.push(...textAt(colRate, textY, 10, 'F1', row.rate.slice(0, 14)));
    if (row.bill) cmds.push(...textAt(colBill, textY, 10, 'F2', row.bill.slice(0, 14)));
    y -= rowGap;
  }

  y -= 4;
  cmds.push(...rule(margin, y, margin + contentW));
  y -= 18;
  for (const total of orderFormTotalLines(input)) {
    if (y < margin + 40) break;
    cmds.push(...textAt(margin, y, 11, 'F2', total.slice(0, 78)));
    y -= 16;
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

export function orderFormFileName(input: OrderFormInput): string {
  const order = shortOrderLabel(input.orderId, {
    inquiry: isInquiry(input.intent),
  }).replace(/\s+/g, '');
  return `${order}-form.pdf`;
}
