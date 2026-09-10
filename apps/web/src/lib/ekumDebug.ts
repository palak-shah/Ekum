/**
 * Developer on-screen error dump. Default false — traders only see friendly toasts;
 * structured failures stay in the console via `logApiError`.
 *
 * Enable:
 * - Build: `VITE_EKUM_DEBUG=true`
 * - Runtime: `localStorage.setItem('ekum.debug', 'true')` then reload
 * Disable runtime: `localStorage.setItem('ekum.debug', 'false')` or remove the key
 * (env still applies when key is absent).
 */
export function isEkumDebug(
  envValue: string | boolean | undefined = import.meta.env.VITE_EKUM_DEBUG as
    | string
    | boolean
    | undefined,
  storageGet: ((key: string) => string | null) | null =
    typeof localStorage !== 'undefined'
      ? (key) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        }
      : null,
): boolean {
  const stored = storageGet?.('ekum.debug');
  if (stored === 'true' || stored === '1') return true;
  if (stored === 'false' || stored === '0') return false;
  if (envValue === true || envValue === 'true' || envValue === '1') return true;
  return false;
}
