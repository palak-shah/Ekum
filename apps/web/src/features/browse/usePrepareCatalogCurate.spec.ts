import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrepareCatalogCurate } from './usePrepareCatalogCurate';

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('./catalogWholeOrder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./catalogWholeOrder')>();
  return {
    ...actual,
    fetchCollectionOrderPreview: vi.fn(),
    resolveCatalogOrderAlbums: vi.fn(async () => ({
      shortlist: [
        {
          productId: 'p1',
          name: 'Dohar A',
          companyId: 'mill',
          companyName: 'Mill',
          images: [],
          allowForward: true,
        },
      ],
      remainingAlbums: [],
      navigateToCollectionId: null,
      expandedAlbumNames: ['Cotton Lot'],
      lockedProductIds: [],
    })),
  };
});

describe('usePrepareCatalogCurate', () => {
  it('expands relistable albums without a resolve choice', async () => {
    const { result } = renderHook(() => usePrepareCatalogCurate());
    let prepared: Awaited<ReturnType<typeof result.current.prepare>> | null = null;
    await act(async () => {
      prepared = await result.current.prepare({
        albums: [
          {
            collectionId: 'c1',
            name: 'Cotton Lot',
            coverImage: null,
            companyId: 'mill',
            companyName: 'Mill',
            allowForward: true,
            kind: 'regular',
          },
        ],
        shortlist: [],
      });
    });
    expect(prepared?.kind).toBe('curate');
    if (prepared?.kind === 'curate') {
      expect(prepared.shortlist.map((row) => row.productId)).toEqual(['p1']);
      expect(prepared.expandedAlbumNames).toEqual(['Cotton Lot']);
    }
  });

  it('opens designs-only when no relistable albums', async () => {
    const { result } = renderHook(() => usePrepareCatalogCurate());
    let prepared: Awaited<ReturnType<typeof result.current.prepare>> | null = null;
    await act(async () => {
      prepared = await result.current.prepare({
        albums: [
          {
            collectionId: 'locked',
            name: 'Locked',
            coverImage: null,
            companyId: 'mill',
            companyName: 'Mill',
            allowForward: false,
          },
        ],
        shortlist: [
          {
            productId: 'solo',
            name: 'Solo',
            companyId: 'mill',
            companyName: 'Mill',
            images: [],
            allowForward: true,
          },
        ],
      });
    });
    expect(prepared?.kind).toBe('curate');
    if (prepared?.kind === 'curate') {
      expect(prepared.shortlist.map((row) => row.productId)).toEqual(['solo']);
    }
  });
});
