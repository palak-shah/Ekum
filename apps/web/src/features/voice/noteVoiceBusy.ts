/** Sheet CTA stays disabled while mic is live or the clip is uploading. */
export function noteVoiceSheetBusy(input: {
  uploading: boolean;
  recording: boolean;
}): boolean {
  return input.uploading || input.recording;
}
