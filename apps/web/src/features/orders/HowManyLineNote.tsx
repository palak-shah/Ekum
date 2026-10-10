import { TextInput } from '@/ui/kit';

/**
 * Optional per-design caption. Always one quiet line so How many / Edit order /
 * builder share the same chrome (everyday place + edit).
 */
export function HowManyLineNote({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <TextInput
      className="mt-1.5 h-8 min-h-8 text-[13px]"
      placeholder="Note"
      value={value}
      disabled={disabled}
      data-testid="how-many-note"
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
