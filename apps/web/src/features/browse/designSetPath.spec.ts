import { describe, expect, it } from 'vitest';
import { designSetPath, parseDesignSetIds, parseQuoteDesignNavState } from './designSetPath';

describe('designSetPath', () => {
  it('builds a designs set URL from product ids', () => {
    expect(designSetPath(['p1', 'p2'])).toBe('/designs/set?ids=p1%2Cp2');
  });

  it('dedupes and caps ids', () => {
    expect(parseDesignSetIds('p1,p1, p2')).toEqual(['p1', 'p2']);
  });

  it('adds facilitator when present', () => {
    expect(designSetPath(['a', 'b'], { facilitator: 'co-x' })).toContain('facilitator=co-x');
  });

  it('carries chat thread and message for Quote', () => {
    const path = designSetPath(['a', 'b'], { threadId: 't1', messageId: 'm9' });
    expect(path).toContain('thread=t1');
    expect(path).toContain('msg=m9');
  });

  it('reads Quote navigation state', () => {
    expect(parseQuoteDesignNavState({ quoteDesign: { messageId: 'm1', productId: 'p2' } })).toEqual({
      messageId: 'm1',
      productId: 'p2',
    });
    expect(parseQuoteDesignNavState({})).toBeNull();
  });
});
