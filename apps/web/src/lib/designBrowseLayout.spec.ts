import { afterEach, describe, expect, it } from 'vitest';
import {
  EKUM_DEFAULT_DESIGN_BROWSE_LAYOUT,
  designBrowsePhotoClass,
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
} from './designBrowseLayout';

const COMPANY = 'co-layout-test';

describe('designBrowseLayout', () => {
  afterEach(() => {
    localStorage.removeItem(`ekum.designBrowseLayout.${COMPANY}`);
  });

  it('defaults to feed when unset or no company', () => {
    expect(EKUM_DEFAULT_DESIGN_BROWSE_LAYOUT).toBe('feed');
    expect(readDesignBrowseLayout(undefined)).toBe('feed');
    expect(readDesignBrowseLayout(COMPANY)).toBe('feed');
  });

  it('round-trips last choice per company', () => {
    writeDesignBrowseLayout(COMPANY, 'grid');
    expect(readDesignBrowseLayout(COMPANY)).toBe('grid');
    writeDesignBrowseLayout(COMPANY, 'feed');
    expect(readDesignBrowseLayout(COMPANY)).toBe('feed');
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem(`ekum.designBrowseLayout.${COMPANY}`, 'mosaic');
    expect(readDesignBrowseLayout(COMPANY)).toBe('feed');
  });

  it('keeps feed design photos mid-size, not 3/4 portrait', () => {
    expect(designBrowsePhotoClass('feed')).toContain('h-64');
    expect(designBrowsePhotoClass('feed')).not.toContain('aspect-[');
    expect(designBrowsePhotoClass('grid')).toContain('h-32');
  });

  it('does not write without companyId', () => {
    writeDesignBrowseLayout(undefined, 'grid');
    expect(localStorage.getItem(`ekum.designBrowseLayout.${COMPANY}`)).toBeNull();
  });
});
