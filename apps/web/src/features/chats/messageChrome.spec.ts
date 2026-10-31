import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MESSAGE_ACTIONS_CHEVRON_CLASS,
  MESSAGE_ACTIONS_MENU_CLASS,
  MESSAGE_ACTIONS_REACTION_RAIL_CLASS,
  MESSAGE_ACTIONS_ROW_CLASS,
  MESSAGE_ACTIONS_VERB_ORDER,
  MSG_BUBBLE_TIME_CLASS,
  MSG_BUBBLE_TIME_HUG_CLASS,
  messageChromeBubblePad,
  resolveMessageLongPress,
} from './messageChrome';

describe('messageChromeBubblePad', () => {
  it('does not reserve idle chevron pad — overlay only', () => {
    expect(messageChromeBubblePad(false)).toBeUndefined();
    expect(messageChromeBubblePad(true)).toBeUndefined();
  });
});

describe('MSG_BUBBLE_TIME_CLASS', () => {
  it('right-aligns media time without a chevron bleed', () => {
    expect(MSG_BUBBLE_TIME_CLASS).toMatch(/text-right/);
    expect(MSG_BUBBLE_TIME_CLASS).not.toMatch(/-mr-8/);
  });
});

describe('MSG_BUBBLE_TIME_HUG_CLASS', () => {
  it('floats time onto the last text line', () => {
    expect(MSG_BUBBLE_TIME_HUG_CLASS).toMatch(/float-right/);
  });
});

describe('message actions popover chrome', () => {
  it('floats without a hairline box', () => {
    expect(MESSAGE_ACTIONS_MENU_CLASS).toMatch(/rounded-2xl/);
    expect(MESSAGE_ACTIONS_MENU_CLASS).toMatch(/min-w-\[11rem\]/);
    expect(MESSAGE_ACTIONS_MENU_CLASS).toMatch(/shadow-menu/);
    expect(MESSAGE_ACTIONS_MENU_CLASS).not.toMatch(/border-line/);
  });

  it('uses sheet-like verb rows without a Delete footer rule', () => {
    expect(MESSAGE_ACTIONS_ROW_CLASS).toMatch(/py-3\.5/);
    expect(MESSAGE_ACTIONS_ROW_CLASS).toMatch(/last:border-b-0/);
    expect(MESSAGE_ACTIONS_ROW_CLASS).not.toMatch(/border-t/);
    expect(MESSAGE_ACTIONS_VERB_ORDER).toEqual([
      'Reply',
      'Forward',
      'Copy',
      'Star',
      'Edit',
      'Select',
      'Delete',
    ]);
  });

  it('keeps reactions as a foam rail, not a verb', () => {
    expect(MESSAGE_ACTIONS_REACTION_RAIL_CLASS).toMatch(/bg-foam/);
    expect(MESSAGE_ACTIONS_REACTION_RAIL_CLASS).not.toMatch(/border-t/);
    expect(MESSAGE_ACTIONS_VERB_ORDER).not.toContain('👍');
  });

  it('keeps the chevron a glyph, not a hover disc', () => {
    expect(MESSAGE_ACTIONS_CHEVRON_CLASS).toMatch(/h-7 w-7/);
    expect(MESSAGE_ACTIONS_CHEVRON_CLASS).not.toMatch(/rounded-full/);
    expect(MESSAGE_ACTIONS_CHEVRON_CLASS).not.toMatch(/hover:bg-/);
  });

  it('wires the restyle onto the thread popover (reactions first)', () => {
    const src = readFileSync(resolve(__dirname, 'ThreadPage.tsx'), 'utf8');
    expect(src).toContain('MESSAGE_ACTIONS_MENU_CLASS');
    expect(src).toContain('MESSAGE_ACTIONS_CHEVRON_CLASS');
    const rail = src.indexOf('data-testid="message-actions-reactions"');
    const reply = src.indexOf('label="Reply"');
    expect(rail).toBeGreaterThan(-1);
    expect(rail).toBeLessThan(reply);
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

  it('opens menu for idle text long-press (Select is a menu item)', () => {
    expect(
      resolveMessageLongPress({
        selecting: false,
        canToggleSelect: false,
        opensMenu: false,
        hasActions: true,
        canEnterSelect: true,
      }),
    ).toBe('open-menu');
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
