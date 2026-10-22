import { cx } from '@/lib/cx';
import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';
import { CameraIcon, ProductIcon } from '@/ui/icons';

export function AddDesignsControl({
  size,
  uploading,
  disabled,
  photosDisabled,
  onDesigns,
  onPhotos,
}: {
  size: 'hero' | 'compact';
  uploading?: boolean;
  disabled?: boolean;
  /** At photo cap on create — designs from library still allowed. */
  photosDisabled?: boolean;
  onDesigns: () => void;
  onPhotos: () => void;
}) {
  const hero = size === 'hero';
  const icon = hero ? 22 : 18;

  const tileClass = cx(
    `flex min-w-0 items-center justify-center border border-dashed border-line ${FIELD_IDLE_FILL_CLASS} font-emphasis text-accent hover:bg-surface disabled:opacity-40`,
    hero
      ? 'min-h-40 flex-col gap-2 rounded-2xl px-3 text-sm'
      : 'min-h-12 gap-2 rounded-xl px-2 text-sm',
  );

  return (
    <div className="grid w-full grid-cols-2 gap-3" data-testid="collection-add-doors">
      <button
        type="button"
        data-testid="collection-add-designs"
        className={tileClass}
        disabled={disabled}
        onClick={onDesigns}
      >
        <ProductIcon width={icon} height={icon} className="shrink-0" />
        <span className="text-center leading-snug">Add from existing designs</span>
      </button>
      <button
        type="button"
        data-testid="collection-add-photos"
        className={tileClass}
        disabled={disabled || photosDisabled}
        onClick={onPhotos}
      >
        <CameraIcon width={icon} height={icon} className="shrink-0" />
        <span className="truncate">
          {uploading ? (hero ? 'Uploading…' : 'Adding…') : 'Add photos'}
        </span>
      </button>
    </div>
  );
}
