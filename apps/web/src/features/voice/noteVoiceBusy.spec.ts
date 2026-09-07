import { describe, expect, it } from 'vitest';
import { noteVoiceSheetBusy } from './noteVoiceBusy';

describe('noteVoiceSheetBusy', () => {
  it('is clear after upload when not recording', () => {
    expect(noteVoiceSheetBusy({ uploading: false, recording: false })).toBe(false);
  });

  it('stays busy while recording or uploading', () => {
    expect(noteVoiceSheetBusy({ uploading: false, recording: true })).toBe(true);
    expect(noteVoiceSheetBusy({ uploading: true, recording: false })).toBe(true);
  });
});
