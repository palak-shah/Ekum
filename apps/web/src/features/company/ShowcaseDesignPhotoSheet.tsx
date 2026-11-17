import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BUSINESS_SHOWCASE_MAX, type CursorPage, type ExploreProductCard } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { Button, EmptyState, LoadingBlock, Sheet, cx } from '@/ui/kit';
import { CoverImage } from '@/ui/cards';
import { showcaseSlotsLeft } from './showcaseUrls';

type DesignPhoto = {
  url: string;
  designName: string;
  designId: string;
};

function flattenOwnDesignPhotos(designs: ExploreProductCard[]): DesignPhoto[] {
  const out: DesignPhoto[] = [];
  const seen = new Set<string>();
  for (const design of designs) {
    for (const url of design.images ?? []) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, designName: design.name, designId: design.id });
    }
  }
  return out;
}

/**
 * Pick image URLs from the signed-in company's own designs only.
 * Selection chrome matches accent-border tiles (not native checkboxes).
 */
export function ShowcaseDesignPhotoSheet({
  open,
  onClose,
  companyId,
  showcaseUrls,
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  showcaseUrls: string[];
  onConfirm: (urls: string[]) => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const slots = showcaseSlotsLeft(showcaseUrls.length);
  const already = useMemo(() => new Set(showcaseUrls), [showcaseUrls]);

  const designs = useQuery({
    queryKey: ['company', companyId, 'designs', 'showcase-pick'],
    queryFn: () =>
      api.get<CursorPage<ExploreProductCard>>(`/companies/${companyId}/designs`, {
        limit: 50,
      }),
    enabled: open && Boolean(companyId),
  });

  const photos = useMemo(
    () => flattenOwnDesignPhotos(designs.data?.results ?? []).filter((p) => !already.has(p.url)),
    [designs.data?.results, already],
  );

  const toggle = (url: string) => {
    setSelected((prev) => {
      if (prev.includes(url)) return prev.filter((item) => item !== url);
      if (prev.length >= slots) return prev;
      return [...prev, url];
    });
  };

  const close = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="From my designs">
      <div className="flex flex-col gap-3" data-testid="showcase-design-picker">
        <p className="text-xs text-muted">
          Pick photos from your designs. {slots} slot{slots === 1 ? '' : 's'} left (max{' '}
          {BUSINESS_SHOWCASE_MAX}).
        </p>
        {designs.isLoading ? <LoadingBlock label="Loading designs…" /> : null}
        {!designs.isLoading && photos.length === 0 ? (
          <EmptyState title="No design photos to add" />
        ) : null}
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const isOn = selected.includes(photo.url);
            const blocked = !isOn && selected.length >= slots;
            return (
              <button
                key={photo.url}
                type="button"
                data-testid={`showcase-design-photo-${photo.designId}`}
                disabled={busy || blocked}
                aria-pressed={isOn}
                className={cx(
                  'relative aspect-square overflow-hidden rounded-xl border-2 bg-foam disabled:opacity-40',
                  isOn ? 'border-accent bg-accent/5' : 'border-transparent',
                )}
                onClick={() => toggle(photo.url)}
              >
                <CoverImage src={photo.url} alt={photo.designName} className="h-full w-full object-cover" />
                {isOn ? (
                  <span className="absolute right-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-emphasis text-on-accent">
                    Selected
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <Button
          fullWidth
          data-testid="showcase-design-confirm"
          disabled={busy || selected.length === 0}
          onClick={() => {
            onConfirm(selected);
            setSelected([]);
          }}
        >
          {busy ? 'Saving…' : `Add ${selected.length || ''}`.trim()}
        </Button>
      </div>
    </Sheet>
  );
}
