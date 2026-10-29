import { Field } from '@/ui/kit';
import { OptionSheetField } from '@/ui/OptionSheetField';

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
        <OptionSheetField
          testId={testId}
          sheetTitle="Category"
          ariaLabel="Master category"
          value={value ?? ''}
          options={options.map((option) => ({ value: option.id, label: option.label }))}
          onChange={onChange}
        />
      )}
    </Field>
  );
}
