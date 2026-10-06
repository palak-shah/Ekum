import { useEffect, useRef } from 'react';
import { cx } from '@/lib/cx';
import { CameraIcon, ProductIcon } from '@/ui/icons';

export function AddDesignsControl({
  open,
  size,
  uploading,
  disabled,
  onOpen,
  onClose,
  onDesigns,
  onPhotos,
}: {
  open: boolean;
  size: 'hero' | 'compact';
  uploading?: boolean;
  disabled?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDesigns: () => void;
  onPhotos: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hero = size === 'hero';
  const icon = hero ? 28 : 18;

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  const shell = cx(
    'w-full overflow-hidden border border-dashed border-line bg-foam',
    hero ? 'min-h-40 rounded-2xl' : 'rounded-xl',
    disabled ? 'opacity-40' : null,
  );

  const choiceClass = cx(
    'flex w-full items-center justify-center gap-2 font-semibold text-ink hover:bg-line/30',
    hero ? 'min-h-[5rem] flex-1 flex-col text-base' : 'min-h-12 text-sm',
  );

  if (open) {
    return (
      <div
        ref={wrapRef}
        role="menu"
        data-testid="collection-source-menu"
        className={cx(shell, hero ? 'flex flex-col' : null)}
      >
        <button
          type="button"
          role="menuitem"
          data-testid="collection-source-designs"
          className={choiceClass}
          onClick={onDesigns}
        >
          <ProductIcon width={icon} height={icon} className="text-muted" />
          Designs
        </button>
        <div className="mx-8 h-px bg-line" />
        <button
          type="button"
          role="menuitem"
          data-testid="collection-source-photos"
          className={choiceClass}
          onClick={onPhotos}
        >
          <CameraIcon width={icon} height={icon} className="text-muted" />
          Photos
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      <button
        type="button"
        data-testid="collection-add-designs"
        onClick={onOpen}
        disabled={disabled}
        className={cx(
          shell,
          'flex items-center justify-center gap-2 text-muted disabled:opacity-40',
          hero ? 'min-h-40 flex-col px-3' : 'min-h-12 text-sm font-medium',
        )}
      >
        <ProductIcon width={hero ? 32 : 18} height={hero ? 32 : 18} />
        <span className={hero ? 'text-base font-semibold text-ink' : undefined}>
          {uploading ? (hero ? 'Uploading…' : 'Adding…') : 'Add designs'}
        </span>
      </button>
    </div>
  );
}
