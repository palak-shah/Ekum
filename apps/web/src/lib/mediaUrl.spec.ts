import { describe, expect, it } from 'vitest';
import { toAbsoluteMediaUrl } from './mediaUrl';

describe('toAbsoluteMediaUrl', () => {
  it('turns relative /media paths into absolute page URLs', () => {
    expect(toAbsoluteMediaUrl('/media/c1/a.jpg', 'https://beta.ekum.app')).toBe(
      'https://beta.ekum.app/media/c1/a.jpg',
    );
  });

  it('rewrites localhost media hosts to the page origin', () => {
    expect(
      toAbsoluteMediaUrl('http://localhost:8080/media/c1/a.jpg', 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/c1/a.jpg');
  });

  it('leaves already-correct absolute URLs alone', () => {
    expect(
      toAbsoluteMediaUrl('https://beta.ekum.app/media/c1/a.jpg', 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/c1/a.jpg');
  });
});
