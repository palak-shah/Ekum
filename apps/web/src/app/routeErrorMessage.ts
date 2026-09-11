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
