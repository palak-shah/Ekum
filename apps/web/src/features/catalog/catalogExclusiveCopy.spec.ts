import { describe, expect, it } from 'vitest';
import {
  CATALOG_EXCLUSIVE_NOTE_CLASS,
  CATALOG_EXCLUSIVE_NOTE_TEXT_CLASS,
} from './catalogExclusiveCopy';

describe('catalog exclusive note highlight', () => {
  it('uses the warning wash so traders cannot skim past it', () => {
    expect(CATALOG_EXCLUSIVE_NOTE_CLASS).toMatch(/bg-warning-soft/);
    expect(CATALOG_EXCLUSIVE_NOTE_TEXT_CLASS).toMatch(/font-emphasis/);
    expect(CATALOG_EXCLUSIVE_NOTE_TEXT_CLASS).toMatch(/text-warning-ink/);
  });
});
