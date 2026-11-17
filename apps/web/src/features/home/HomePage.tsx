import { BusinessProfileBody } from '@/features/company/CompanyProfilePage';
import { useCompanyId } from '@/lib/auth';
import { LoadingBlock } from '@/ui/kit';

/** Home tab — own Business Profile (display). Needs attention lives on Orders / Chats. */
export function HomePage() {
  const companyId = useCompanyId();
  if (!companyId) {
    return <LoadingBlock label="Loading business…" />;
  }
  return <BusinessProfileBody companyId={companyId} variant="home" />;
}
