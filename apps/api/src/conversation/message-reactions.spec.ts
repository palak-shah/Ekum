import { describe, expect, it } from 'vitest';
import { foldMessageReactions } from './message-reactions';

describe('foldMessageReactions', () => {
  it('counts per emoji and marks this shop', () => {
    const folded = foldMessageReactions(
      [
        { messageId: 'm1', emoji: '👍', companyId: 'us' },
        { messageId: 'm1', emoji: '👍', companyId: 'them' },
        { messageId: 'm1', emoji: '❤️', companyId: 'them' },
      ],
      'us',
    );
    expect(folded.get('m1')).toEqual([
      { emoji: '👍', count: 2, mine: true },
      { emoji: '❤️', count: 1, mine: false },
    ]);
  });
});
