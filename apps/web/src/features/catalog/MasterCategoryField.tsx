import { Field, cx } from '@/ui/kit';
import { SELECT_FIELD_CLASS } from '@/ui/fieldFill';

export function MasterCategoryField({
  value,
  onChange,
  options,
  locked = false,
  required = false,
  error,
  testId = 'collection-master-category',
}: {
  value: string | null;
  onChange: (next: string) => void;
  options: { id: string; label: string }[];
  /** Pack already chose Category — show the label, no dropdown. */
  locked?: boolean;
  required?: boolean;
  error?: string | null;
  testId?: string;
}) {
  if (!locked && options.length === 0) return null;
  const selected = options.find((option) => option.id === value);

  return (
    <Field label="Category" required={required && !locked} error={error}>
      {locked ? (
        <div
          data-testid={testId}
          className="flex h-10 items-center rounded-xl border border-line bg-foam/90 px-3 text-sm font-body text-ink"
        >
          {selected?.label || 'From collection'}
        </div>
      ) : (
        <select
          data-testid={testId}
          aria-label="Master category"
          className={cx(
            SELECT_FIELD_CLASS,
            'h-10 w-full px-3 text-sm font-body',
            value ? 'text-ink' : 'text-muted',
          )}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value=""></option>
          {options.map((option) => (
            <option key={option.id} value={option.id} className="text-sm font-body">
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
