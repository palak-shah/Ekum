type Props = {
  onFollow: () => void;
  pending?: boolean;
};

/** Compact Follow control for Explore post card headers. */
export function ExploreFeedFollowAction({ onFollow, pending = false }: Props) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFollow();
      }}
      className="shrink-0 text-xs font-bold text-accent disabled:opacity-45"
      data-testid="explore-feed-follow"
    >
      {pending ? 'Following…' : 'Follow'}
    </button>
  );
}
