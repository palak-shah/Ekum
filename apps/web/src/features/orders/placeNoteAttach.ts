/** Common ticket note fields from How many / Place (text + voice + photos). */
export type PlaceNoteAttach = {
  note?: string;
  noteVoiceMediaId?: string;
  noteVoiceDurationMs?: number;
  noteImageUrls?: string[];
};

export function placeNoteAttachFields(
  place?: PlaceNoteAttach | null,
): PlaceNoteAttach {
  const out: PlaceNoteAttach = {};
  const note = place?.note?.trim();
  if (note) out.note = note;
  if (place?.noteVoiceMediaId && place.noteVoiceDurationMs) {
    out.noteVoiceMediaId = place.noteVoiceMediaId;
    out.noteVoiceDurationMs = place.noteVoiceDurationMs;
  }
  if (place?.noteImageUrls?.length) {
    out.noteImageUrls = place.noteImageUrls.slice(0, 9);
  }
  return out;
}
