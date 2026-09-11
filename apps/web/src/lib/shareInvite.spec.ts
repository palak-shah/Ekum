import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  catalogShareCopy,
  inviteShareCopy,
  nativeShareFields,
  shareMessageText,
  shareOrCopyInvite,
} from './shareInvite';

describe('shareMessageText', () => {
  it('puts the url on its own line so messengers make it tappable', () => {
    expect(shareMessageText('Wedding silks on Ekum — this collection', 'https://ekum.app/s/abc')).toBe(
      'Wedding silks on Ekum — this collection\nhttps://ekum.app/s/abc',
    );
  });

  it('does not duplicate an url already in the text', () => {
    const url = 'https://ekum.app/s/abc';
    expect(shareMessageText(`See it\n${url}`, url)).toBe(`See it\n${url}`);
  });
});

describe('nativeShareFields', () => {
  it('omits url when the message already contains it (WhatsApp double-paste)', () => {
    const url = 'https://beta.ekum.app/r/abc';
    expect(
      nativeShareFields({
        title: 'Ekum · Connect with Jaipur Emporium',
        text: 'Jaipur Emporium invites you to connect on Ekum',
        url,
      }),
    ).toEqual({
      title: 'Ekum · Connect with Jaipur Emporium',
      text: `Jaipur Emporium invites you to connect on Ekum\n${url}`,
    });
  });
});

describe('inviteShareCopy', () => {
  it('names the business for connect invites', () => {
    expect(inviteShareCopy({ kind: 'connect', companyName: 'Jaipur Emporium' })).toEqual({
      title: 'Ekum · Connect with Jaipur Emporium',
      text: 'Jaipur Emporium invites you to connect on Ekum',
    });
  });

  it('names both parties for vouch invites', () => {
    expect(
      inviteShareCopy({
        kind: 'vouch',
        companyName: 'Surat Silk House',
        targetName: 'Jaipur Emporium',
      }),
    ).toEqual({
      title: 'Ekum · Surat Silk House introduces Jaipur Emporium',
      text: 'Surat Silk House introduces Jaipur Emporium on Ekum',
    });
  });
});

describe('catalogShareCopy', () => {
  it('names Ekum and the pack so the link is not a bare URL', () => {
    expect(catalogShareCopy({ name: 'Wedding silks', kind: 'collection' })).toEqual({
      title: 'Ekum · Wedding silks',
      text: 'Wedding silks on Ekum — this collection',
    });
  });

  it('calls a single design a design', () => {
    expect(catalogShareCopy({ name: 'Banarasi', kind: 'product' }).text).toContain('design');
  });
});

describe('shareOrCopyInvite', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      share: vi.fn(async () => undefined),
      clipboard: { writeText: vi.fn(async () => undefined) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shares without a separate url field when the link is in the body', async () => {
    const url = 'https://beta.ekum.app/r/tok';
    await shareOrCopyInvite({
      url,
      title: 'Ekum · Connect with JE',
      text: 'JE invites you to connect on Ekum',
    });
    expect(navigator.share).toHaveBeenCalledWith({
      title: 'Ekum · Connect with JE',
      text: `JE invites you to connect on Ekum\n${url}`,
    });
  });
});
