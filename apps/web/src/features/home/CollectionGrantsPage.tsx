import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CollectionViewGrantView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { LoadingBlock, EmptyState } from '@/ui/kit';

/** Expanded list behind the single Home “You can view N collections” need. */
export function CollectionGrantsPage() {
  const grants = useQuery({
    queryKey: ['collection-view-grants', 'mine'],
    queryFn: () =>
      api.get<CollectionViewGrantView[]>('/collection-view-requests/grants/mine'),
  });

  return (
    <div className="flex flex-col gap-3 pb-24">
      <PageHeader title="Collections you can view" backTo="/" />
      {grants.isLoading ? <LoadingBlock /> : null}
      {grants.isError ? (
        <p className="text-sm text-danger">Could not load grants.</p>
      ) : null}
      {grants.isSuccess && grants.data.length === 0 ? (
        <EmptyState title="None yet" message="When a shop Allows a pack for you, it shows here." />
      ) : null}
      <ul className="flex flex-col gap-2">
        {(grants.data ?? []).map((grant) => (
          <li key={`${grant.collectionId}-${grant.companyId}`}>
            <Link
              to={`/collections/${grant.collectionId}`}
              className="flex flex-col rounded-2xl border border-line bg-surface px-3 py-2.5"
            >
              <span className="text-sm font-semibold text-ink">{grant.collectionName}</span>
              <span className="text-xs text-muted">{grant.company.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
