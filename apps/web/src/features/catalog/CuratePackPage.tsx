import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { PageHeader } from '@/ui/PageHeader';
import { LoadingBlock } from '@/ui/kit';

/** Deep link: curate current shortlist, or send user to Saved select mode. */
export function CuratePackPage() {
  const navigate = useNavigate();
  const shortlist = useBrowseShortlist();

  useEffect(() => {
    if (shortlist.count < 1) {
      navigate('/saved?select=1', { replace: true });
    }
  }, [shortlist.count, navigate]);

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
