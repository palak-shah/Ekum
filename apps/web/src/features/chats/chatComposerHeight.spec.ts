import { describe, expect, it } from 'vitest';
import {
  CHAT_COMPOSER_MAX_PX,
  CHAT_COMPOSER_MIN_PX,
  chatComposerHeightPx,
} from './chatComposerHeight';

describe('chatComposerHeightPx', () => {
  it('floors empty/short content to one line', () => {
    expect(chatComposerHeightPx(0)).toBe(CHAT_COMPOSER_MIN_PX);
    expect(chatComposerHeightPx(20)).toBe(CHAT_COMPOSER_MIN_PX);
  });

  it('grows with content until the cap', () => {
    expect(chatComposerHeightPx(48)).toBe(48);
    expect(chatComposerHeightPx(CHAT_COMPOSER_MAX_PX)).toBe(CHAT_COMPOSER_MAX_PX);
    expect(chatComposerHeightPx(CHAT_COMPOSER_MAX_PX + 40)).toBe(CHAT_COMPOSER_MAX_PX);
  });
});
