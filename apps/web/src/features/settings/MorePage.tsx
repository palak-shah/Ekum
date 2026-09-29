import { useNavigate } from 'react-router-dom';
import { MyCatalogPage } from '@/features/catalog/MyCatalogPage';
import { useAuth } from '@/lib/auth';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { Avatar, Card, Tag } from '@/ui/kit';

/** You root — title + ⋯ live in AppShell (same band as Chats), not a second PageHeader. */
export function MorePage() {
  const navigate = useNavigate();
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
              <p className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  data-testid="you-edit"
                  className="inline-flex h-7 items-center rounded-lg border border-accent bg-surface px-2 text-[12px] font-semibold tracking-tight text-accent hover:bg-accent/5"
                  onClick={() => navigate('/settings/profile')}
                >
                  Edit profile
                </button>
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
