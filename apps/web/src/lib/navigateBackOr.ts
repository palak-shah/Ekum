/**
 * Back for detail screens. React Router gives the first history entry key
 * `"default"` (pasted URL / push open / hard reload). In that case `navigate(-1)`
 * leaves the SPA or goes nowhere — send them to a known list instead.
 */
export function navigateBackOr(
  navigate: (to: string | number) => void,
  locationKey: string,
  fallbackPath: string,
): void {
  if (locationKey !== 'default') {
    navigate(-1);
    return;
  }
  navigate(fallbackPath);
}
