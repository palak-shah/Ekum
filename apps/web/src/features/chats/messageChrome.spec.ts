import { describe, expect, it } from 'vitest';
import {
  MSG_BUBBLE_CLASS,
  messageChromeBubblePad,
  resolveMessageLongPress,
} from './messageChrome';

describe('messageChromeBubblePad', () => {
  it('targets painted bubbles, not direct children only', () => {
    expect(messageChromeBubblePad(false)).toBeUndefined();
    expect(messageChromeBubblePad(true)).toBe(`[&_.${MSG_BUBBLE_CLASS}]:pr-8`);
  });
});

describe('resolveMessageLongPress', () => {
  it('opens menu for photo-style long-press when not selecting', () => {
    expect(
      resolveMessageLongPress({
        selecting: false,
        canToggleSelect: false,
        opensMenu: true,
        hasActions: true,
        canEnterSelect: true,
      }),
    ).toBe('open-menu');
  });

  it('enters select for non-photo long-press', () => {
    expect(
      resolveMessageLongPress({
        selecting: false,
        canToggleSelect: false,
        opensMenu: false,
        hasActions: true,
        canEnterSelect: true,
      }),
    ).toBe('enter-select');
  });

  it('toggles select while already selecting', () => {
    expect(
      resolveMessageLongPress({
        selecting: true,
        canToggleSelect: true,
        opensMenu: true,
        hasActions: true,
        canEnterSelect: true,
      }),
    ).toBe('toggle-select');
  });
});
