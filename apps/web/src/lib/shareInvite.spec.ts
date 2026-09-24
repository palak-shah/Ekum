import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  catalogShareCopy,
  companyShareCopy,
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

describe('companyShareCopy', () => {
  it('names the shop', () => {
    expect(companyShareCopy('Surat Silk House')).toEqual({
      title: 'Surat Silk House on Ekum',
      text: 'Surat Silk House on Ekum',
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

  it('names the group on a join invite', () => {
    expect(
      inviteShareCopy({
        kind: 'group',
        companyName: 'Jaipur Emporium',
        groupName: 'Wedding circle',
      }),
    ).toEqual({
      title: 'Ekum · Join Wedding circle',
      text: 'Jaipur Emporium invites you to Wedding circle on Ekum',
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
  it('names the seller and pack so the link is worth opening', () => {
    expect(
      catalogShareCopy({
        name: 'Mill Lot',
        kind: 'collection',
        companyName: 'Surat Silk House',
      }),
    ).toEqual({
      title: 'Surat Silk House · Mill Lot',
      text: 'Surat Silk House shared Mill Lot on Ekum',
    });
  });

  it('calls a single design a design when name is empty', () => {
    expect(
      catalogShareCopy({ name: '', kind: 'product', companyName: 'Surat Silk House' }).text,
    ).toContain('a design');
  });

  it('says designs for a multi-design share', () => {
    expect(
      catalogShareCopy({
        name: '3 designs',
        kind: 'designs',
        companyName: 'Surat Silk House',
      }),
    ).toEqual({
      title: 'Surat Silk House · 3 designs',
      text: 'Surat Silk House shared designs on Ekum',
    });
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

  it('opens the share sheet and does not copy when share succeeds', async () => {
    const url = 'https://beta.ekum.app/g/tok';
    const result = await shareOrCopyInvite({
      url,
      title: 'Ekum · Join Wedding circle',
      text: 'JE invites you to Wedding circle on Ekum',
      preferShareSheet: true,
    });
    expect(result).toBe('shared');
    expect(navigator.share).toHaveBeenCalled();
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });
});
