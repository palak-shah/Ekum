/** Marks the painted bubble so MessageChrome can pad for the actions chevron. */
export const MSG_BUBBLE_CLASS = 'ekum-msg-bubble';

/** Pad painted bubbles (not wrappers) so the chevron sits inside the fill. */
export function messageChromeBubblePad(hasActions: boolean): string | undefined {
  return hasActions ? '[&_.ekum-msg-bubble]:pr-8' : undefined;
}

export type MessageLongPressIntent = 'toggle-select' | 'open-menu' | 'enter-select' | 'none';

/** WhatsApp-style: photo long-press opens Ekum menu; other types enter Select. */
export function resolveMessageLongPress(input: {
  selecting: boolean;
  canToggleSelect: boolean;
  /** Photo (and similar): long-press opens actions menu. */
  opensMenu: boolean;
  hasActions: boolean;
  canEnterSelect: boolean;
}): MessageLongPressIntent {
  if (input.selecting) return input.canToggleSelect ? 'toggle-select' : 'none';
  if (input.opensMenu && input.hasActions) return 'open-menu';
  if (input.canEnterSelect) return 'enter-select';
  return 'none';
}
