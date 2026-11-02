/** Shared confirm copy. `remove` = trader ×. `off` = mill Share / unfollow. */
export function DirectLinkRevokeCopy({ mode = 'remove' }: { mode?: 'remove' | 'off' }) {
  if (mode === 'off') {
    return (
      <p className="text-sm text-ink" data-testid="direct-link-revoke-copy">
        Direct links for this shop will go off until they can share your collections again.
        Existing orders stay as they are.
      </p>
    );
  }
  return (
    <p className="text-sm text-ink" data-testid="direct-link-revoke-copy">
      Continuing will remove the affected Direct Link(s). Future orders will not route through
      those relationships, and automatic reposting will stop. Existing orders stay as they are.
    </p>
  );
}
