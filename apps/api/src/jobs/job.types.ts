/**
 * A background job handler. Each handler declares the job `type` it processes
 * and a `run` that is idempotent-friendly: the runner may retry it, so handlers
 * should tolerate being invoked more than once for the same logical work.
 */
export interface JobHandler {
  readonly type: string;
  run(payload: Record<string, unknown>): Promise<void>;
}

/** DI token for the array of registered job handlers. */
export const JOB_HANDLERS = Symbol('JOB_HANDLERS');
