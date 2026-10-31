/** Marks the painted bubble so MessageChrome can pad for the actions chevron. */
export const MSG_BUBBLE_CLASS = 'ekum-msg-bubble';

/** Pad painted bubbles (not wrappers) so the chevron sits inside the fill. */
export function messageChromeBubblePad(hasActions: boolean): string | undefined {
  // Chevron overlays the bubble (hover / while menu open) — no idle layout pad.
  void hasActions;
  return undefined;
}

/** Attached message-actions popover — bubble radius, float shadow, no hairline box. */
export const MESSAGE_ACTIONS_MENU_CLASS =
  'fixed z-[70] min-w-[11rem] overflow-hidden rounded-2xl bg-surface shadow-menu';

/** Verb rows: same density as thread ⋯ MoreActionRow (px-3 — popover has no sheet pad). */
export const MESSAGE_ACTIONS_ROW_CLASS =
  'flex w-full items-center gap-3 border-b border-line/70 px-3 py-3.5 text-left last:border-b-0 hover:bg-foam/70 active:bg-foam';

/** Reactions sit in this foam band first — not mixed into the verb list. */
export const MESSAGE_ACTIONS_REACTION_RAIL_CLASS =
  'flex items-center justify-evenly bg-foam px-2 py-2';

/** Overlay chevron: glyph only, no hover disc. Hit target stays 28px. */
export const MESSAGE_ACTIONS_CHEVRON_CLASS =
  'absolute right-1 top-1 z-20 flex h-7 w-7 items-center justify-center';

/** Verb order in the popover (reactions are a separate top rail when present). */
export const MESSAGE_ACTIONS_VERB_ORDER = [
  'Reply',
  'Forward',
  'Copy',
  'Star',
  'Edit',
  'Select',
  'Delete',
] as const;

/** Trailing time under media / trade-card body (not a reserved empty band). */
export const MSG_BUBBLE_TIME_CLASS =
  'text-right tabular-nums text-[length:var(--ekum-text-badge)] leading-none';

/** Short text: time hugs the last line (WhatsApp float). */
export const MSG_BUBBLE_TIME_HUG_CLASS =
  'float-right ml-2.5 mt-2 text-[length:var(--ekum-text-badge)] tabular-nums leading-none';

export type MessageLongPressIntent = 'toggle-select' | 'open-menu' | 'enter-select' | 'none';

/** Idle long-press opens the actions menu. Select is a menu item. While Selecting, toggle. */
export function resolveMessageLongPress(input: {
  selecting: boolean;
  canToggleSelect: boolean;
  /** @deprecated Idle long-press always opens the menu when actions exist. */
  opensMenu: boolean;
  hasActions: boolean;
  canEnterSelect: boolean;
}): MessageLongPressIntent {
  if (input.selecting) return input.canToggleSelect ? 'toggle-select' : 'none';
  if (input.hasActions) return 'open-menu';
  void input.opensMenu;
  void input.canEnterSelect;
  return 'none';
}
