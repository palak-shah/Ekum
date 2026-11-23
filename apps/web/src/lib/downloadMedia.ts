/** Fetch a media URL (usually signed) and trigger a file save. */
export async function downloadMediaFile(url: string, fileBase: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const ext =
    blob.type === 'image/png'
      ? 'png'
      : blob.type === 'image/webp'
        ? 'webp'
        : 'jpg';
  anchor.href = objectUrl;
  anchor.download = `${fileBase || 'design'}.${ext}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
