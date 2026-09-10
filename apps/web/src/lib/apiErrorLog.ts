import { isEkumDebug } from './ekumDebug';

export type ApiErrorLogPayload = {
  source: 'ekum.api';
  method: string;
  path: string;
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
  envelopePath?: string;
};

export function buildApiErrorLog(input: {
  method: string;
  path: string;
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  envelopePath?: string;
}): ApiErrorLogPayload {
  return {
    source: 'ekum.api',
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    code: input.code,
    message: input.message,
    details: input.details ?? null,
    envelopePath: input.envelopePath,
  };
}

/** Skip the 401 that is about to trigger a token refresh retry. */
export function shouldLogApiError(input: {
  statusCode: number;
  willRetryAuth: boolean;
}): boolean {
  if (input.willRetryAuth && input.statusCode === 401) return false;
  return true;
}

export function logApiError(
  payload: ApiErrorLogPayload,
  write: (payload: ApiErrorLogPayload) => void = (entry) => {
    console.error(entry);
  },
): void {
  write(payload);
  if (!isEkumDebug()) return;
  // Dynamic import avoids a circular init with the debug store UI.
  void import('./apiErrorDebugStore').then(({ setApiErrorDebug }) => {
    setApiErrorDebug(payload);
  });
}
