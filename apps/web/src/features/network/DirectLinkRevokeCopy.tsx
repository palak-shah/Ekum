/** Shared confirm copy before an action that drops Direct Links. */
export function DirectLinkRevokeCopy() {
  return (
    <p className="text-sm text-ink" data-testid="direct-link-revoke-copy">
      Continuing will remove the affected Direct Link(s). Future orders will not route through
      those relationships, and automatic reposting will stop. Existing orders stay as they are.
    </p>
  );
}
