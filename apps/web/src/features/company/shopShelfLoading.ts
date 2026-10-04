/** Shop catalog LoadingBlock — only wait on the active tab’s shelf. */
export function shopShelfLoading(
  tab: 'collections' | 'designs',
  collectionsLoading: boolean,
  designsLoading: boolean,
): boolean {
  return tab === 'collections' ? collectionsLoading : designsLoading;
}
