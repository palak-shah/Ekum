import type { useExploreCompanyRelationships } from './useExploreCompanyRelationships';
import { ExploreFeedFollowAction } from './ExploreFeedFollowAction';

type FeedRelationships = ReturnType<typeof useExploreCompanyRelationships>;

export function exploreFeedFollowTrailing(
  companyId: string,
  companyName: string,
  selecting: boolean,
  rel: FeedRelationships,
) {
  if (selecting || !rel.shouldShowFollow(companyId)) return undefined;
  return (
    <ExploreFeedFollowAction
      pending={rel.isFollowPending(companyId)}
      onFollow={() => rel.follow(companyId, companyName)}
    />
  );
}
