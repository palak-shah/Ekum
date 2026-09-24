import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyCatalogPage } from '@/features/catalog/MyCatalogPage';
import { CompanyShareSheet } from '@/features/company/CompanyShareSheet';
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
  const [shareOpen, setShareOpen] = useState(false);
  const showLibrary = selling || trading;
  const companyId = company.data?.id ?? '';

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
              <p className="mt-1.5 text-xs font-semibold text-accent">
                <button
                  type="button"
                  data-testid="you-edit"
                  className="hover:underline"
                  onClick={() => navigate('/settings/profile')}
                >
                  Edit
                </button>
                <span className="px-1.5 font-medium text-muted">·</span>
                <button
                  type="button"
                  data-testid="you-share"
                  className="hover:underline disabled:opacity-45"
                  disabled={!companyId}
                  onClick={() => setShareOpen(true)}
                >
                  Share
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

      {companyId ? (
        <CompanyShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          companyId={companyId}
          companyName={company.data?.name ?? 'Your business'}
        />
      ) : null}
    </div>
  );
}
