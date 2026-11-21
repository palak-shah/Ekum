/**
 * Lightweight multi-hop perf samples — no company ids, product ids, or rates.
 * Log-only; does not change permission or fail-closed behaviour.
 */
import { Logger } from '@nestjs/common';

const logger = new Logger('RepostHopPerf');

export type RepostHopOp = 'lineage_credit' | 'availability' | 'pricing_resolve';

export type RepostHopFailure =
  | 'none'
  | 'incomplete_chain'
  | 'cycle'
  | 'missing_source'
  | 'unknown';

export type RepostHopPerfSample = {
  op: RepostHopOp;
  /** Ancestor packs walked (or visited pack count for pricing). */
  hopCount: number;
  /** BFS / recursive query rounds. */
  queryRounds: number;
  durationMs: number;
  failure: RepostHopFailure;
  /** Packs in the batch (feed / shelf), when applicable. */
  packCount?: number;
};

export type RepostHopPerfNote = Partial<
  Pick<RepostHopPerfSample, 'hopCount' | 'queryRounds' | 'failure' | 'packCount'>
>;

/** Safe payload for logs / tests — never include business identifiers. */
export function sanitizeRepostHopPerf(sample: RepostHopPerfSample): RepostHopPerfSample {
  return {
    op: sample.op,
    hopCount: Math.max(0, Math.floor(sample.hopCount)),
    queryRounds: Math.max(0, Math.floor(sample.queryRounds)),
    durationMs: Math.max(0, Math.floor(sample.durationMs)),
    failure: sample.failure,
    ...(sample.packCount != null
      ? { packCount: Math.max(0, Math.floor(sample.packCount)) }
      : {}),
  };
}

export function recordRepostHopPerf(sample: RepostHopPerfSample): void {
  const safe = sanitizeRepostHopPerf(sample);
  logger.debug(JSON.stringify({ kind: 'repost_hop_perf', ...safe }));
}

/**
 * Time an async hop walk. Callers note hopCount / queryRounds / failure via `note`.
 * Errors rethrow after recording `unknown` (or a noted failure).
 */
export async function withRepostHopPerf<T>(
  op: RepostHopOp,
  run: (note: (partial: RepostHopPerfNote) => void) => Promise<T>,
): Promise<T> {
  const started = Date.now();
  let noted: RepostHopPerfNote = {};
  const note = (partial: RepostHopPerfNote) => {
    noted = { ...noted, ...partial };
  };
  try {
    const result = await run(note);
    recordRepostHopPerf({
      op,
      hopCount: noted.hopCount ?? 0,
      queryRounds: noted.queryRounds ?? 0,
      durationMs: Date.now() - started,
      failure: noted.failure ?? 'none',
      packCount: noted.packCount,
    });
    return result;
  } catch (err) {
    recordRepostHopPerf({
      op,
      hopCount: noted.hopCount ?? 0,
      queryRounds: noted.queryRounds ?? 0,
      durationMs: Date.now() - started,
      failure: noted.failure ?? 'unknown',
      packCount: noted.packCount,
    });
    throw err;
  }
}
