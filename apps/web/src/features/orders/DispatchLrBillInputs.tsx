import { TextInput } from '@/ui/kit';

export const DISPATCH_LR_NUMBER_PLACEHOLDER = 'LR number';
export const DISPATCH_BILL_NUMBER_PLACEHOLDER = 'Bill number';

/** Empty LR / Bill fields name themselves — no shared header that scrolls away. */
export function DispatchLrBillInputs({
  lrNumber,
  billNumber,
  index,
  onLrNumber,
  onBillNumber,
}: {
  lrNumber: string;
  billNumber: string;
  index: number;
  onLrNumber: (next: string) => void;
  onBillNumber: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextInput
        value={lrNumber}
        placeholder={DISPATCH_LR_NUMBER_PLACEHOLDER}
        aria-label={`LR number ${index + 1}`}
        onChange={(event) => onLrNumber(event.target.value)}
      />
      <TextInput
        value={billNumber}
        placeholder={DISPATCH_BILL_NUMBER_PLACEHOLDER}
        aria-label={`Bill number ${index + 1}`}
        onChange={(event) => onBillNumber(event.target.value)}
      />
    </div>
  );
}
