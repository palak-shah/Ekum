import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompanyCard } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Avatar, Button, Card, EmptyState, LoadingBlock } from '@/ui/kit';

export function FollowingPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<CompanyCard[]>('/follows/following'),
  });

  const unfollow = useMutation({
    mutationFn: (companyId: string) => api.del<{ following: false }>(`/follows/${companyId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['follows', 'following'] });
      showToast('Unfollowed');
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not unfollow.', 'danger'),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Following" />
      {following.isLoading ? (
        <LoadingBlock />
      ) : following.data && following.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {following.data.map((company) => (
            <Card key={company.id} className="flex items-center gap-3">
              <Link to={`/company/${company.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={company.name} imageUrl={company.logoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{company.name}</p>
                  <p className="truncate text-xs text-muted">{company.city}</p>
                </div>
              </Link>
              <Button
                variant="secondary"
                disabled={unfollow.isPending}
                onClick={() => unfollow.mutate(company.id)}
              >
                Unfollow
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Not following anyone yet"
          message="Follow businesses from Explore or a company profile to see their posts."
        />
      )}
    </div>
  );
}
