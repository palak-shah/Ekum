import { describe, expect, it } from 'vitest';
import { placeNoteAttachFields } from './placeNoteAttach';

describe('placeNoteAttachFields', () => {
  it('omits empty attach', () => {
    expect(placeNoteAttachFields({})).toEqual({});
    expect(placeNoteAttachFields({ note: '  ' })).toEqual({});
  });

  it('keeps trimmed note, voice, and up to 9 images', () => {
    expect(
      placeNoteAttachFields({
        note: '  Rush  ',
        noteVoiceMediaId: 'm1',
        noteVoiceDurationMs: 900,
        noteImageUrls: ['a', 'b'],
      }),
    ).toEqual({
      note: 'Rush',
      noteVoiceMediaId: 'm1',
      noteVoiceDurationMs: 900,
      noteImageUrls: ['a', 'b'],
    });
  });

  it('drops voice without duration', () => {
    expect(placeNoteAttachFields({ noteVoiceMediaId: 'm1' })).toEqual({});
  });
});
