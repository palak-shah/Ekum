import { describe, expect, it } from 'vitest';
import { viewerPackTicket } from './viewer-pack-ticket';

describe('viewerPackTicket (BM — sr 16 collection path copy)', () => {
  it('is I handle when no lane exists yet', () => {
    expect(
      viewerPackTicket({
        isOwner: false,
        millCompanyIds: ['mill-a'],
        lanes: [],
      }),
    ).toBe('me');
  });

  it('is mill only when every mill on the pack is ticket mill', () => {
    expect(
      viewerPackTicket({
        isOwner: false,
        millCompanyIds: ['mill-a', 'mill-b'],
        lanes: [
          { sellerCompanyId: 'mill-a', ticket: 'mill' },
          { sellerCompanyId: 'mill-b', ticket: 'mill' },
        ],
      }),
    ).toBe('mill');
  });

  it('stays I handle if any mill is still me', () => {
    expect(
      viewerPackTicket({
        isOwner: false,
        millCompanyIds: ['mill-a', 'mill-b'],
        lanes: [
          { sellerCompanyId: 'mill-a', ticket: 'mill' },
          { sellerCompanyId: 'mill-b', ticket: 'me' },
        ],
      }),
    ).toBe('me');
  });

  it('is null for the pack owner or a mill-only pack', () => {
    expect(
      viewerPackTicket({
        isOwner: true,
        millCompanyIds: ['mill-a'],
        lanes: [{ sellerCompanyId: 'mill-a', ticket: 'mill' }],
      }),
    ).toBeNull();
    expect(
      viewerPackTicket({
        isOwner: false,
        millCompanyIds: [],
        lanes: [],
      }),
    ).toBeNull();
  });
});
