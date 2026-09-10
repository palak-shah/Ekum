import type { ExplorePost } from '@ekum/domain-types';

function companyOf(post: ExplorePost) {
  return post.kind === 'product' ? post.product.company : post.collection.company;
}

export function companyIdOf(post: ExplorePost): string {
  return companyOf(post).id;
}

export type HomePostGroup = {
  id: string;
  companyId: string;
  companyName: string;
  city: string | null;
  count: number;
  latest: ExplorePost;
  sortAt: string;
};

/** One row per company; count posts; keep newest as `latest`. */
export function groupPostsByCompany(posts: ExplorePost[]): HomePostGroup[] {
  const groups = new Map<string, ExplorePost[]>();
  for (const post of posts) {
    const companyId = companyIdOf(post);
    const list = groups.get(companyId) ?? [];
    list.push(post);
    groups.set(companyId, list);
  }

  const rows: HomePostGroup[] = [];
  for (const [companyId, list] of groups) {
    const sorted = [...list].sort(
      (a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt),
    );
    const latest = sorted[0]!;
    const company = companyOf(latest);
    rows.push({
      id: `post-group-${companyId}`,
      companyId,
      companyName: company.name,
      city: company.city?.trim() || null,
      count: list.length,
      latest,
      sortAt: latest.postedAt,
    });
  }

  return rows.sort((a, b) => Date.parse(b.sortAt) - Date.parse(a.sortAt));
}

/** First usable photo on a post — Home/Chats should open on cloth, not empty ivory. */
export function homePostImage(post: ExplorePost): string | null {
  if (post.kind === 'product') {
    return post.product.images[0] ?? null;
  }
  return post.collection.coverImage ?? post.collection.previewImages[0] ?? null;
}

export function homePostTitle(count: number, companyName: string): string {
  if (count <= 1) return `New post · ${companyName}`;
  return `${count} new posts · ${companyName}`;
}

export function homePostLink(post: ExplorePost): string {
  return post.kind === 'product'
    ? `/explore/products/${post.product.id}`
    : `/collections/${post.collection.id}`;
}

/** Single post → design/collection; several → Explore story listing for that company. */
export function homePostGroupLink(group: HomePostGroup): string {
  if (group.count <= 1) return homePostLink(group.latest);
  return `/explore?story=${encodeURIComponent(group.companyId)}`;
}

/**
 * @deprecated Prefer groupPostsByCompany — Home now shows counts per company.
 * Kept for any caller that only needs the newest post per company.
 */
export function dedupeMarketPostsByCompany(posts: ExplorePost[]): ExplorePost[] {
  return groupPostsByCompany(posts).map((group) => group.latest);
}
