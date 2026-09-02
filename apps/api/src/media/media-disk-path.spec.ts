import { describe, expect, it } from 'vitest';
import { mediaDiskCandidates } from './media-disk-path';

describe('mediaDiskCandidates', () => {
  it('tries slash path then Express-array comma filename', () => {
    expect(mediaDiskCandidates('seed-company-ravi/BqZV8KTkgpMvhe_z.png')).toEqual([
      'seed-company-ravi/BqZV8KTkgpMvhe_z.png',
      'seed-company-ravi,BqZV8KTkgpMvhe_z.png',
    ]);
  });

  it('leaves seed/name.jpg as a single candidate', () => {
    expect(mediaDiskCandidates('seed/kanjee.jpg')).toEqual([
      'seed/kanjee.jpg',
      'seed,kanjee.jpg',
    ]);
  });

  it('rejects parent segments', () => {
    expect(mediaDiskCandidates('../secret')).toEqual([]);
  });
});
