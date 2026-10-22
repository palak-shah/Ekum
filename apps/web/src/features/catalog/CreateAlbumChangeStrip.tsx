import { cx } from '@/lib/cx';
import {
  CREATE_ALBUM_STRIP_MAX,
  createAlbumChangeLabel,
} from './createAlbumChangeLabel';

export function CreateAlbumChangeStrip({
  thumbs,
  count,
  expanded,
  onToggle,
}: {
  thumbs: Array<{ key: string; src: string }>;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const label = createAlbumChangeLabel(count);
  return (
    <button
      type="button"
      data-testid="collection-album-change"
      aria-expanded={expanded}
      aria-label={label}
      onClick={onToggle}
      className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-foam px-3 py-3"
    >
      {thumbs.length > 0 ? (
        <span className="flex items-center">
          {thumbs.slice(0, CREATE_ALBUM_STRIP_MAX).map((thumb, i) => (
            <span
              key={thumb.key}
              className={cx(
                'relative h-14 w-10 overflow-hidden rounded-lg border-2 border-canvas bg-foam',
                i > 0 && '-ml-2.5',
              )}
              style={{ zIndex: i }}
            >
              <img src={thumb.src} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
        </span>
      ) : null}
      <span className="text-sm font-emphasis text-accent">{label}</span>
    </button>
  );
}
