import { describe, expect, it } from 'vitest';
import {
  HOW_MANY_NOTE_MAX_PX,
  HOW_MANY_NOTE_MIN_PX,
  howManyNoteHeightPx,
} from './howManyNoteHeight';

describe('howManyNoteHeightPx', () => {
  it('stays one line until content needs more', () => {
    expect(howManyNoteHeightPx(0)).toBe(HOW_MANY_NOTE_MIN_PX);
    expect(howManyNoteHeightPx(24)).toBe(HOW_MANY_NOTE_MIN_PX);
  });

  it('grows with wrap then caps', () => {
    expect(howManyNoteHeightPx(64)).toBe(64);
    expect(howManyNoteHeightPx(HOW_MANY_NOTE_MAX_PX + 30)).toBe(HOW_MANY_NOTE_MAX_PX);
  });
});
