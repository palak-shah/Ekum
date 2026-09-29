/** Published select dock: send first, tidy next, Curate last. */
export function youLibraryPublishedDockSlots(canCurate: boolean): Array<
  'order' | 'share' | 'hide' | 'archive' | 'curate'
> {
  return canCurate
    ? ['order', 'share', 'hide', 'archive', 'curate']
    : ['order', 'share', 'hide', 'archive'];
}
