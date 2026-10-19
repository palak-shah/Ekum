import { describe, expect, it } from 'vitest';
import {
  getYouLibrarySelectMenu,
  setYouLibrarySelectMenu,
} from './youLibrarySelectMenu';

describe('youLibrarySelectMenu', () => {
  it('stores select actions for the page ⋯', () => {
    const onDraft = () => undefined;
    const onPublish = () => undefined;
    const onArchive = () => undefined;
    setYouLibrarySelectMenu({
      selecting: true,
      canDraft: true,
      canPublish: false,
      canArchive: true,
      onDraft,
      onPublish,
      onArchive,
    });
    expect(getYouLibrarySelectMenu()?.canDraft).toBe(true);
    expect(getYouLibrarySelectMenu()?.canArchive).toBe(true);
    setYouLibrarySelectMenu(null);
    expect(getYouLibrarySelectMenu()).toBeNull();
  });
});
