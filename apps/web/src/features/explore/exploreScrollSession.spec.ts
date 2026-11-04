import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyExploreScrollRestore,
  clearExploreScrollSession,
  exploreCollectionOpenTestId,
  findExploreCollectionAnchor,
  noteExploreCollectionOpen,
  peekExploreScrollRestore,
  shellMainScrollEl,
  writeExploreHomeTailOpen,
  writeExploreScrollTop,
} from './exploreScrollSession';

afterEach(() => {
  clearExploreScrollSession();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('exploreScrollSession', () => {
  beforeEach(() => {
    clearExploreScrollSession();
    document.body.innerHTML = '';
  });

  it('notes focus collection when pathname is /explore', () => {
    vi.stubGlobal('location', { pathname: '/explore' });
    const main = document.createElement('main');
    main.className = 'ekum-shell-scroll';
    main.scrollTop = 420;
    document.body.appendChild(main);

    writeExploreHomeTailOpen(true);
    noteExploreCollectionOpen('pack-1');

    expect(peekExploreScrollRestore()).toEqual({
      focusCollectionId: 'pack-1',
      scrollTop: 420,
      homeTailOpen: true,
    });
  });

  it('ignores note when not on Explore', () => {
    vi.stubGlobal('location', { pathname: '/chats' });
    writeExploreHomeTailOpen(true);
    noteExploreCollectionOpen('pack-1');
    expect(peekExploreScrollRestore()).toEqual({
      focusCollectionId: null,
      scrollTop: 0,
      homeTailOpen: true,
    });
  });

  it('apply scrolls to the pack article and clears', () => {
    vi.stubGlobal('location', { pathname: '/explore' });
    const main = document.createElement('main');
    main.className = 'ekum-shell-scroll';
    Object.defineProperty(main, 'scrollTop', {
      writable: true,
      value: 0,
    });
    main.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        bottom: 800,
        right: 400,
        width: 400,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.appendChild(main);

    const article = document.createElement('article');
    article.getBoundingClientRect = () =>
      ({
        top: 600,
        left: 0,
        bottom: 1200,
        right: 400,
        width: 400,
        height: 600,
        x: 0,
        y: 600,
        toJSON: () => ({}),
      }) as DOMRect;
    const photos = document.createElement('div');
    photos.setAttribute('data-testid', 'explore-collection-photos-pack-1');
    const caption = document.createElement('a');
    caption.setAttribute('data-testid', exploreCollectionOpenTestId('pack-1'));
    article.appendChild(photos);
    article.appendChild(caption);
    main.appendChild(article);

    noteExploreCollectionOpen('pack-1');
    expect(findExploreCollectionAnchor('pack-1')).toBe(article);
    expect(applyExploreScrollRestore()).toBe(true);
    expect(main.scrollTop).toBe(600);
    expect(peekExploreScrollRestore()).toBeNull();
  });

  it('waits for focus when waitForFocus and anchor missing', () => {
    vi.stubGlobal('location', { pathname: '/explore' });
    noteExploreCollectionOpen('missing');
    expect(applyExploreScrollRestore({ waitForFocus: true })).toBe(false);
    expect(peekExploreScrollRestore()?.focusCollectionId).toBe('missing');
  });

  it('falls back to scrollTop when focus node missing', () => {
    vi.stubGlobal('location', { pathname: '/explore' });
    const main = document.createElement('main');
    main.className = 'ekum-shell-scroll';
    Object.defineProperty(main, 'scrollTop', { writable: true, value: 880 });
    document.body.appendChild(main);

    noteExploreCollectionOpen('gone');
    expect(peekExploreScrollRestore()?.scrollTop).toBe(880);

    main.scrollTop = 0;
    expect(applyExploreScrollRestore()).toBe(true);
    expect(main.scrollTop).toBe(880);
    expect(peekExploreScrollRestore()).toBeNull();
  });

  it('shellMainScrollEl finds the phone column main', () => {
    const main = document.createElement('main');
    main.className = 'ekum-shell-scroll';
    document.body.appendChild(main);
    expect(shellMainScrollEl()).toBe(main);
  });
});
