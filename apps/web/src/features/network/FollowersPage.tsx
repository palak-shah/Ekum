import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CompanyCard } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Card, EmptyState, LoadingBlock } from '@/ui/kit';

export function FollowersPage() {
  const followers = useQuery({
    queryKey: ['follows', 'followers'],
    queryFn: () => api.get<CompanyCard[]>('/follows/followers'),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Followers" />
      {followers.isLoading ? (
        <LoadingBlock />
      ) : followers.data && followers.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {followers.data.map((company) => (
            <Card key={company.id} className="flex items-center gap-3">
              <Link to={`/company/${company.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={company.name} imageUrl={company.logoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{company.name}</p>
                  <p className="truncate text-xs text-muted">{company.city}</p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No followers yet"
          message="When other businesses follow you, they show up here."
        />
      )}
    </div>
  );
}
