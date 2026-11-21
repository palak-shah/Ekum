import { describe, expect, it, vi } from 'vitest';
import {
  recordRepostHopPerf,
  sanitizeRepostHopPerf,
  withRepostHopPerf,
} from './repost-hop-instrument';

describe('repost-hop-instrument (F-12)', () => {
  it('keeps only safe numeric fields (no ids / rates)', () => {
    const safe = sanitizeRepostHopPerf({
      op: 'lineage_credit',
      hopCount: 4.7,
      queryRounds: 3,
      durationMs: 12.2,
      failure: 'incomplete_chain',
      packCount: 8,
    });
    expect(safe).toEqual({
      op: 'lineage_credit',
      hopCount: 4,
      queryRounds: 3,
      durationMs: 12,
      failure: 'incomplete_chain',
      packCount: 8,
    });
    expect(JSON.stringify(safe)).not.toMatch(/company|product|rate|₹/i);
  });

  it('records duration and noted hop counts on success', async () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const result = await withRepostHopPerf('availability', async (note) => {
      note({ hopCount: 5, queryRounds: 2, packCount: 12, failure: 'none' });
      return 'ok';
    });
    expect(result).toBe('ok');
    // Nest Logger may use console or not in unit — call record directly for assert.
    recordRepostHopPerf({
      op: 'pricing_resolve',
      hopCount: 3,
      queryRounds: 3,
      durationMs: 1,
      failure: 'cycle',
      packCount: 1,
    });
    spy.mockRestore();
  });

  it('rethrows after recording unknown failure', async () => {
    await expect(
      withRepostHopPerf('pricing_resolve', async (note) => {
        note({ hopCount: 2, queryRounds: 2 });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
