import { useRef, type ReactNode } from 'react';
import { ChevronDownIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';
import { BUYER_TALKS_TO, BUYER_TALKS_TO_YOU } from '@/features/orders/iHandleDesk';

type Ticket = 'me' | 'mill';

export function TicketPathPick({
  ticket,
  millLabel,
  millNames,
  disabled,
  onPick,
  pickTestId,
  meTestId,
  millTestId,
  millNamesTestId = 'order-ticket-mill-names',
  help,
}: {
  ticket: Ticket;
  millLabel: string;
  millNames: string[];
  disabled?: boolean;
  onPick: (ticket: Ticket) => void;
  pickTestId: string;
  meTestId: string;
  millTestId: string;
  millNamesTestId?: string;
  help?: ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedLabel = ticket === 'me' ? BUYER_TALKS_TO_YOU : millLabel;
  const selectedNames = ticket === 'mill' ? millNames : [];

  const choose = (value: Ticket) => {
    if (value !== ticket) onPick(value);
    detailsRef.current?.removeAttribute('open');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-ink">{BUYER_TALKS_TO}</p>
        {help}
      </div>
      <details ref={detailsRef} className="relative">
        <summary
          data-testid={pickTestId}
          className={cx(
            'flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-accent bg-accent/5 px-3 py-2.5 text-left',
            disabled ? 'pointer-events-none opacity-60' : '',
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{selectedLabel}</p>
            {selectedNames.length > 0 ? (
              <ul className="mt-1 flex flex-col gap-0.5" data-testid={millNamesTestId}>
                {selectedNames.map((name) => (
                  <li key={name} className="text-xs text-muted">
                    {name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </summary>
        <div className="absolute left-0 right-0 z-20 mt-1 flex flex-col gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-sm">
          {(
            [
              { value: 'me' as const, label: BUYER_TALKS_TO_YOU, names: [] as string[] },
              { value: 'mill' as const, label: millLabel, names: millNames },
            ] as const
          ).map((option) => {
            const selected = ticket === option.value;
            return (
              <button
                key={option.value}
                type="button"
                data-testid={option.value === 'me' ? meTestId : millTestId}
                disabled={disabled || selected}
                onClick={() => choose(option.value)}
                className={cx(
                  'w-full rounded-lg px-3 py-2 text-left',
                  selected ? 'bg-accent/5' : 'hover:bg-foam',
                )}
              >
                <p className="text-sm font-semibold text-ink">{option.label}</p>
                {option.names.length > 0 ? (
                  <ul
                    className="mt-1 flex flex-col gap-0.5"
                    data-testid={ticket === 'mill' ? undefined : millNamesTestId}
                  >
                    {option.names.map((name) => (
                      <li key={name} className="text-xs text-muted">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
