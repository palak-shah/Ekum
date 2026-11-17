/** Network hub + destination titles (Iteration 4B). Routes stay following/followers. */
export const NETWORK_FOLLOWING = {
  title: 'Following',
  /** Hub row hint and destination PageHeader subtitle. */
  subtitle: 'Businesses you see updates from.',
} as const;

export const NETWORK_FOLLOWERS = {
  title: 'Followers',
  subtitle: 'Businesses who can see your updates.',
} as const;

export const NETWORK_CONNECTIONS = {
  title: 'Connections',
  subtitle: 'Businesses you can communicate with.',
} as const;
