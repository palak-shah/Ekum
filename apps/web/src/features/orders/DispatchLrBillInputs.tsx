import { TextInput } from '@/ui/kit';
import { SHEET_TEXT_INPUT_CLASS } from '@/ui/mobileOverflow';

export const DISPATCH_LR_NUMBER_PLACEHOLDER = 'LR number';
export const DISPATCH_BILL_NUMBER_PLACEHOLDER = 'Bill/bale number';

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
        className={SHEET_TEXT_INPUT_CLASS}
        onChange={(event) => onLrNumber(event.target.value)}
      />
      <TextInput
        value={billNumber}
        placeholder={DISPATCH_BILL_NUMBER_PLACEHOLDER}
        aria-label={`${DISPATCH_BILL_NUMBER_PLACEHOLDER} ${index + 1}`}
        className={SHEET_TEXT_INPUT_CLASS}
        onChange={(event) => onBillNumber(event.target.value)}
      />
    </div>
  );
}
