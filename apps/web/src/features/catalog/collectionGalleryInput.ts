/** Hidden OS gallery input — never use capture so Android Gallery is a picker. */
export const collectionGalleryInputProps = {
  type: 'file' as const,
  accept: 'image/jpeg,image/png,image/webp',
  multiple: true,
};
