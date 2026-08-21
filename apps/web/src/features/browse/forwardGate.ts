/** Plain copy when allowForward is locked (Share / Curate / Forward). */
export const FORWARD_LOCKED_TOAST = "This seller doesn't allow sharing.";

export function canForwardFlag(allowForward: boolean | undefined): boolean {
  return allowForward !== false;
}
