/** Shared Helvetica PDF 1.4 primitives for packing list + order form. */

export type PdfDrawCmd = string;

export type PdfJpegThumb = {
  name: string;
  bytes: Uint8Array;
  width: number;
  height: number;
};

export const PDF_THUMB_PX = 36;
export const PDF_A4 = { pageW: 595, pageH: 842, margin: 48 };

/** Helvetica WinAnsi — keep printable ASCII; map common trade glyphs. */
export function winAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u00B7\u2022\u2024]/g, '-')
    .replace(/\u20B9/g, 'Rs')
    .replace(/[^\x20-\x7E]/g, '?');
}

export function pdfEscape(text: string): string {
  return winAnsi(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function pdfDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function padRight(text: string, width: number): string {
  const t = winAnsi(text);
  if (t.length >= width) return t.slice(0, width);
  return `${t}${' '.repeat(width - t.length)}`;
}

export function padLeft(text: string, width: number): string {
  const t = winAnsi(text);
  if (t.length >= width) return t.slice(0, width);
  return `${' '.repeat(width - t.length)}${t}`;
}

export function textAt(
  x: number,
  y: number,
  size: number,
  font: 'F1' | 'F2',
  text: string,
): PdfDrawCmd[] {
  return ['BT', `/${font} ${size} Tf`, `${x} ${y} Td`, `(${pdfEscape(text)}) Tj`, 'ET'];
}

export function rule(x1: number, y: number, x2: number): PdfDrawCmd[] {
  return [`${x1} ${y} m`, `${x2} ${y} l`, 'S'];
}

export function wrapPdfWords(text: string, maxChars: number): string[] {
  const words = winAnsi(text).split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Fetch design image and re-encode as a square JPEG thumb (works for PNG/WebP too).
 * CORS / missing → null (row still prints without a photo).
 */
export async function jpegThumb(url: string): Promise<PdfJpegThumb | null> {
  if (typeof document === 'undefined') return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = PDF_THUMB_PX;
    canvas.height = PDF_THUMB_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return null;
    }
    const scale = Math.max(PDF_THUMB_PX / bitmap.width, PDF_THUMB_PX / bitmap.height);
    const dw = bitmap.width * scale;
    const dh = bitmap.height * scale;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PDF_THUMB_PX, PDF_THUMB_PX);
    ctx.drawImage(bitmap, (PDF_THUMB_PX - dw) / 2, (PDF_THUMB_PX - dh) / 2, dw, dh);
    bitmap.close();
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82),
    );
    if (!jpeg) return null;
    const buf = new Uint8Array(await jpeg.arrayBuffer());
    return { name: 'Im', bytes: buf, width: PDF_THUMB_PX, height: PDF_THUMB_PX };
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

/** Single A4 page, Helvetica + Helvetica-Bold, optional JPEG thumbs named /Im{i}. */
export function assembleHelveticaA4(
  cmds: PdfDrawCmd[],
  thumbs: Array<PdfJpegThumb | null>,
): Uint8Array {
  const { pageW, pageH } = PDF_A4;
  const stream = cmds.join('\n');
  const streamBytes = new TextEncoder().encode(stream);

  const imageObjs: Array<{ id: number; bytes: Uint8Array; w: number; h: number }> = [];
  let nextId = 7;
  for (const thumb of thumbs) {
    if (!thumb) continue;
    imageObjs.push({ id: nextId, bytes: thumb.bytes, w: thumb.width, h: thumb.height });
    nextId += 1;
  }

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
 * Open the PDF in the phone / browser viewer.
 * Falls back to download when a new tab is blocked.
 */
export function openTradePdf(file: File): 'opened' | 'downloaded' {
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

export const packingSlipJpegThumb = jpegThumb;
export const openPackingSlipPdf = openTradePdf;
