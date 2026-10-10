import { UniversalShareSheet } from '@/features/share/UniversalShareSheet';

export {
  companyProfileShareBody,
  companyProfileShareUrl,
} from '@/features/company/companyProfileShare';

/**
 * Share a shop — thin wrapper over UniversalShareSheet (company payload).
 */
export function CompanyShareSheet({
  open,
  onClose,
  companyId,
  companyName,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}) {
  return (
    <UniversalShareSheet
      open={open}
      onClose={onClose}
      payload={{ kind: 'company', companyId, companyName }}
    />
  );
}
