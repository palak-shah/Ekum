/** Bumped on Logout / hard auth clear so an in-flight refresh cannot write tokens back. */
let generation = 0;

export function authSessionGeneration(): number {
  return generation;
}

export function invalidateAuthSessionGeneration(): number {
  generation += 1;
  return generation;
}

export function isCurrentAuthSession(startedAt: number): boolean {
  return startedAt === generation;
}
