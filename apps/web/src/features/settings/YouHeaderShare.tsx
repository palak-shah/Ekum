import { useState } from 'react';
import { CompanyShareSheet } from '@/features/company/CompanyShareSheet';
import { useMyCompany } from '@/lib/queries';
import { PaperPlaneIcon } from '@/ui/icons';

/** Business profile header Share — same icon + sheet as a shop. */
export function YouHeaderShare() {
  const company = useMyCompany();
  const [open, setOpen] = useState(false);
  const companyId = company.data?.id ?? '';

  return (
    <>
      <button
        type="button"
        data-testid="you-share"
        aria-label="Share"
        disabled={!companyId}
        className="rounded-full p-2 text-slate hover:bg-foam hover:text-ink disabled:opacity-45"
        onClick={() => setOpen(true)}
      >
        <PaperPlaneIcon width={20} height={20} />
      </button>
      {companyId ? (
        <CompanyShareSheet
          open={open}
          onClose={() => setOpen(false)}
          companyId={companyId}
          companyName={company.data?.name ?? 'Your business'}
        />
      ) : null}
    </>
  );
}
