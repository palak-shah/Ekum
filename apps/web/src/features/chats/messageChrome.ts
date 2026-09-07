/** Marks the painted bubble so MessageChrome can pad for the actions chevron. */
export const MSG_BUBBLE_CLASS = 'ekum-msg-bubble';

/** Pad painted bubbles (not wrappers) so the chevron sits inside the fill. */
export function messageChromeBubblePad(hasActions: boolean): string | undefined {
  return hasActions ? '[&_.ekum-msg-bubble]:pr-8' : undefined;
}
