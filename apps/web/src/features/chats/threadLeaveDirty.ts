/** Work that cannot come back as an inbox Draft: row — still needs Leave the page? */
export function threadLeaveDirty(input: {
  attachSelected?: boolean;
  attachSending?: boolean;
  uploadingPhoto?: boolean;
  uploadingDocument?: boolean;
  cameraOpen?: boolean;
  uploadingVoice?: boolean;
  uploadProgress?: boolean;
  forwarding?: boolean;
  selectingWithPile?: boolean;
}): boolean {
  return Boolean(
    input.attachSelected ||
      input.attachSending ||
      input.uploadingPhoto ||
      input.uploadingDocument ||
      input.cameraOpen ||
      input.uploadingVoice ||
      input.uploadProgress ||
      input.forwarding ||
      input.selectingWithPile,
  );
}
