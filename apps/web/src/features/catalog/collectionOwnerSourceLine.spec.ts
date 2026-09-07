import { describe, expect, it } from 'vitest';
import { collectionOwnerSourceLine } from './collectionOwnerSourceLine';

describe('collectionOwnerSourceLine', () => {
  it('is silent when every member is the owner', () => {
    expect(
      collectionOwnerSourceLine('ravi', [{ id: 'ravi', name: 'Surat Silk House' }]),
    ).toBeNull();
  });

  it('names one other shop', () => {
    expect(
      collectionOwnerSourceLine('ravi', [{ id: 'kavita', name: 'Ahmedabad Loom Co' }]),
    ).toBe('From Ahmedabad Loom Co');
  });

  it('names two other shops', () => {
    expect(
      collectionOwnerSourceLine('ravi', [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ]),
    ).toBe('From A, B');
  });

  it('counts three or more other shops', () => {
    expect(
      collectionOwnerSourceLine('ravi', [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ]),
    ).toBe('From 3 shops');
  });

  it('marks mixed own plus others', () => {
    expect(
      collectionOwnerSourceLine('ravi', [
        { id: 'ravi', name: 'Surat Silk House' },
        { id: 'kavita', name: 'Ahmedabad Loom Co' },
      ]),
    ).toBe('Yours and Ahmedabad Loom Co');
    expect(
      collectionOwnerSourceLine('ravi', [
        { id: 'ravi', name: 'Surat Silk House' },
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ]),
    ).toBe('Yours and 2 shops');
  });
});
