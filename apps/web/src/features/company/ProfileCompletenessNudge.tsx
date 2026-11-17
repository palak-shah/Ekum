import { CloseIcon } from '@/ui/icons';
import { Chip, cx } from '@/ui/kit';
import type { ProfileCompletenessChip } from './profileCompleteness';

/** Home-only completeness — kit Chip (chip-on) when incomplete; not a full foam banner. */
export function ProfileCompletenessNudge({
  chips,
  onChip,
  onDismiss,
}: {
  chips: ProfileCompletenessChip[];
  onChip: (id: ProfileCompletenessChip['id']) => void;
  onDismiss: () => void;
}) {
  if (chips.length < 1) return null;

  return (
    <div
      className="relative flex flex-wrap items-center gap-1.5 pr-10"
      data-testid="profile-completeness-nudge"
    >
      <button
        type="button"
        data-testid="profile-completeness-dismiss"
        aria-label="Dismiss"
        className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-accent/5"
        onClick={onDismiss}
      >
        <CloseIcon width={16} height={16} aria-hidden />
      </button>
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          active
          data-testid={`profile-completeness-chip-${chip.id}`}
          onClick={() => onChip(chip.id)}
          className={cx('max-w-full')}
        >
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}
