import { isRouteErrorResponse } from 'react-router-dom';

/** Plain trader copy for route failures (404 / thrown Response / unexpected). */
export function routeErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return "This page isn't available.";
    if (error.status === 401 || error.status === 403) return "You don't have access here.";
    if (error.status >= 500) return "Something went wrong on our side. Try again.";
    const dataMsg =
      error.data && typeof error.data === 'object' && 'message' in error.data
        ? String((error.data as { message?: unknown }).message ?? '')
        : '';
    if (dataMsg.trim()) return dataMsg.trim();
    if (typeof error.data === 'string' && error.data.trim()) return error.data.trim();
    return "This page isn't available.";
  }
  if (error instanceof Error && error.message.trim()) {
    // Keep chunk-load / network failures readable; hide stack noise.
    if (/failed to fetch|loading chunk|dynamically imported/i.test(error.message)) {
      return 'Could not load this page. Check your connection and try again.';
    }
  }
  return 'Something went wrong. Try again.';
}

/** Compact log they can copy or screenshot — not a full stack dump. */
export function routeErrorDetail(error: unknown): string | null {
  if (error == null) return null;
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return null;
    const data =
      error.data && typeof error.data === 'object' && 'message' in error.data
        ? String((error.data as { message?: unknown }).message ?? '').trim()
        : typeof error.data === 'string'
          ? error.data.trim()
          : '';
    const status = `${error.status}${error.statusText ? ` ${error.statusText}` : ''}`.trim();
    return data ? `${status}: ${data}` : status || null;
  }
  if (error instanceof Error) {
    const head = [error.name, error.message.trim()].filter(Boolean).join(': ');
    const frames = (error.stack ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith(error.name))
      .slice(0, 2)
      .join('\n');
    return frames ? `${head}\n${frames}` : head || null;
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
