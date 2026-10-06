import { afterEach, describe, expect, it } from 'vitest';
import {
  readCollectionApplyToAll,
  writeCollectionApplyToAll,
} from './collectionApplyToAll';

const COMPANY = 'co-apply-all-test';

describe('collectionApplyToAll', () => {
  afterEach(() => {
    localStorage.removeItem(`ekum.collectionApplyToAll.${COMPANY}`);
  });

  it('defaults off when unset or no company', () => {
    expect(readCollectionApplyToAll(undefined)).toBe(false);
    expect(readCollectionApplyToAll(COMPANY)).toBe(false);
  });

  it('remembers the last pack choice per company', () => {
    writeCollectionApplyToAll(COMPANY, true);
    expect(readCollectionApplyToAll(COMPANY)).toBe(true);
    writeCollectionApplyToAll(COMPANY, false);
    expect(readCollectionApplyToAll(COMPANY)).toBe(false);
  });

  it('does not write without companyId', () => {
    writeCollectionApplyToAll(undefined, true);
    expect(localStorage.getItem(`ekum.collectionApplyToAll.${COMPANY}`)).toBeNull();
  });
});
