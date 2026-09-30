import { MyCatalogPage } from '@/features/catalog/MyCatalogPage';
import { useAuth } from '@/lib/auth';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { Avatar, Card, Tag } from '@/ui/kit';

/** You root — title + Back (Home) live in AppShell, not a second PageHeader. */
export function MorePage() {
  const { session } = useAuth();
  const company = useMyCompany();
  const { selling, trading } = useTradePresence();
  const showLibrary = selling || trading;

  return (
    <div className="flex flex-col gap-4">
      <div data-testid="you-identity">
        <Card className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Avatar
              name={company.data?.name ?? 'E'}
              imageUrl={company.data?.logoUrl}
              size={56}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold tracking-tight text-ink">
                {company.data?.name ?? 'Your business'}
              </p>
              <p className="truncate text-xs text-muted">
                {[
                  company.data?.contactPerson?.trim() || session?.user.name?.trim(),
                  company.data?.city,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            {company.data?.verification === 'gst_verified' ? (
              <Tag tone="success">Verified</Tag>
            ) : null}
          </div>
        </Card>
      </div>

      <MyCatalogPage embedded catalogTabs={showLibrary} />
    </div>
  );
}
