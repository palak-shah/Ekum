import { SelectableMediaFrame } from '@/ui/selectMediaChrome';

/**
 * Library photo in Add / Replace designs. Same shrink + 18px accent check as
 * album design thumbs — not a green badge ✓ or teal frame.
 */
export function LibraryPickTile({
  name,
  imageUrl,
  selected,
  onClick,
}: {
  name: string;
  imageUrl?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={name}
      className="relative aspect-square w-full min-w-0 overflow-hidden rounded-xl bg-foam text-left"
    >
      <SelectableMediaFrame
        selectMode
        selected={selected}
        checkClassName="right-2 top-2"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-lg font-body text-muted">
            {name.charAt(0)}
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 z-[1] truncate bg-surface/95 px-1.5 py-1 text-sm text-ink">
          {name}
        </span>
      </SelectableMediaFrame>
    </button>
  );
}
