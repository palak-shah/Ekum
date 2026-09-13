import { describe, expect, it } from 'vitest';
import { documentTypeCue, sendMessageSchema, MessageType } from '@ekum/domain-types';
import { classifyChatDocumentFile } from '@/lib/mediaUpload';

function fakeFile(name: string, type: string, size = 100): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('classifyChatDocumentFile', () => {
  it('accepts pdf and office by mime or extension', () => {
    expect(classifyChatDocumentFile(fakeFile('a.pdf', 'application/pdf'))?.kind).toBe('document');
    expect(classifyChatDocumentFile(fakeFile('a.docx', ''))?.kind).toBe('document');
    expect(classifyChatDocumentFile(fakeFile('rates.xlsx', ''))?.kind).toBe('document');
    expect(classifyChatDocumentFile(fakeFile('note.txt', 'text/plain'))?.kind).toBe('document');
  });

  it('accepts images as original-photo documents', () => {
    expect(classifyChatDocumentFile(fakeFile('shot.jpg', 'image/jpeg'))).toEqual({
      kind: 'image',
      contentType: 'image/jpeg',
    });
    expect(classifyChatDocumentFile(fakeFile('shot.png', ''))).toEqual({
      kind: 'image',
      contentType: 'image/png',
    });
  });

  it('rejects video and zip', () => {
    expect(classifyChatDocumentFile(fakeFile('clip.mp4', 'video/mp4'))).toBeNull();
    expect(classifyChatDocumentFile(fakeFile('pack.zip', 'application/zip'))).toBeNull();
  });
});

describe('documentTypeCue', () => {
  it('maps content types and extensions', () => {
    expect(documentTypeCue('application/pdf', 'a.pdf')).toBe('PDF');
    expect(documentTypeCue('image/jpeg', 'shot.jpg')).toBe('Photo');
    expect(documentTypeCue('text/csv', 'x.csv')).toBe('CSV');
  });
});

describe('sendMessageSchema document', () => {
  it('requires matching body and metadata.url', () => {
    const ok = sendMessageSchema.safeParse({
      type: MessageType.Document,
      body: 'https://x/a.pdf',
      metadata: {
        url: 'https://x/a.pdf',
        fileName: 'a.pdf',
        contentType: 'application/pdf',
      },
    });
    expect(ok.success).toBe(true);

    const bad = sendMessageSchema.safeParse({
      type: MessageType.Document,
      body: 'https://x/a.pdf',
      metadata: {
        url: 'https://x/other.pdf',
        fileName: 'a.pdf',
        contentType: 'application/pdf',
      },
    });
    expect(bad.success).toBe(false);
  });
});
