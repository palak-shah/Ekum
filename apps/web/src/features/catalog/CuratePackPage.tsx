import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { useTradePresence } from '@/lib/tradePresence';
import { PageHeader } from '@/ui/PageHeader';
import { LoadingBlock } from '@/ui/kit';

/** Deep link: curate current shortlist, or send user to Saved select mode. */
export function CuratePackPage() {
  const navigate = useNavigate();
  const shortlist = useBrowseShortlist();
  const { trading, isLoading } = useTradePresence();

  useEffect(() => {
    if (isLoading) return;
    if (!trading) return;
    if (shortlist.count < 1) {
      navigate('/saved?select=1', { replace: true });
    }
  }, [isLoading, trading, shortlist.count, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Curate pack" onBack={() => navigate(-1)} />
        <LoadingBlock />
      </div>
    );
  }

  if (!trading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Curate pack" onBack={() => navigate(-1)} />
        <p className="text-sm text-muted">
          Turn on <span className="font-semibold text-ink">I trade on Ekum</span> in Profile to
          curate packs.
        </p>
        <Link to="/profile" className="text-sm font-bold text-accent">
          Open Profile
        </Link>
      </div>
    );
  }

  if (shortlist.count < 1) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Curate pack" onBack={() => navigate(-1)} />
        <LoadingBlock label="Opening Saved…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Curate pack" onBack={() => navigate(-1)} />
      <CurateFromSelectionSheet
        open
        onClose={() => navigate(-1)}
        productIds={shortlist.entries.map((entry) => entry.productId)}
      />
    </div>
  );
}
