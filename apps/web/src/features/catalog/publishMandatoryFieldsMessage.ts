import { ApiError } from '@/lib/apiClient';

/** Trader copy when publish fails because name, category, or designs are missing. */
export const PUBLISH_MANDATORY_FIELDS_MESSAGE = 'Add mandatory fields to publish.';

const MANDATORY_FIELD_CODES = new Set(['INVALID_NAME', 'CATEGORY_REQUIRED', 'COLLECTION_EMPTY']);

export function isPublishMandatoryFieldFailure(reason: unknown): boolean {
  return reason instanceof ApiError && MANDATORY_FIELD_CODES.has(reason.code);
}

/** Toast + in-sheet line after a bulk publish `allSettled` batch. */
export function publishMandatoryFieldsMessage(reasons: unknown[]): string {
  if (reasons.length > 0 && reasons.every(isPublishMandatoryFieldFailure)) {
    return PUBLISH_MANDATORY_FIELDS_MESSAGE;
  }
  const api = reasons.find((r): r is ApiError => r instanceof ApiError);
  return api?.message ?? 'Could not publish.';
}

export function bulkPublishSettled(results: PromiseSettledResult<unknown>[]): {
  ok: number;
  failed: number;
  reasons: unknown[];
} {
  const reasons = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason);
  return { ok: results.length - reasons.length, failed: reasons.length, reasons };
}
