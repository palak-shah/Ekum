import { describe, expect, it } from 'vitest';
import {
  activeMentionQuery,
  insertMentionAt,
  mentionCandidates,
  mentionsFromMetadata,
  mentionsStillInBody,
  withMentionsMetadata,
} from '@ekum/domain-types';

describe('chat mentions', () => {
  it('opens @ at the start of a word, not inside email', () => {
    expect(activeMentionQuery('@ra', 3)).toEqual({ start: 0, query: 'ra' });
    expect(activeMentionQuery('hi @', 4)).toEqual({ start: 3, query: '' });
    expect(activeMentionQuery('ask ravi@shop', 13)).toBeNull();
  });

  it('inserts @Name and keeps the caret after it', () => {
    expect(insertMentionAt('hi @ra', 6, 3, 'Ravi')).toEqual({
      text: 'hi @Ravi ',
      caret: 9,
    });
  });

  it('lists teammates then shops and filters', () => {
    const rows = mentionCandidates({
      people: [
        { userId: 'me', name: 'Meena' },
        { userId: 'u2', name: 'Ravi' },
      ],
      shops: [{ companyId: 'c1', name: 'Surat Silk' }],
      viewerUserId: 'me',
      query: '',
    });
    expect(rows.map((row) => row.name)).toEqual(['Ravi', 'Surat Silk']);
    expect(mentionCandidates({
      people: [{ userId: 'u2', name: 'Ravi' }],
      shops: [{ companyId: 'c1', name: 'Surat Silk' }],
      query: 'sur',
    }).map((row) => row.id)).toEqual(['c1']);
  });

  it('keeps mentions that still appear in the body', () => {
    const mentions = [
      { kind: 'user' as const, id: 'u2', name: 'Ravi' },
      { kind: 'company' as const, id: 'c1', name: 'Surat Silk' },
    ];
    expect(mentionsStillInBody('see @Ravi', mentions)).toEqual([mentions[0]]);
    expect(mentionsFromMetadata({ mentions })).toEqual(mentions);
    expect(withMentionsMetadata(undefined, [])).toBeUndefined();
  });
});
