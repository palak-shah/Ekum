import { describe, expect, it } from 'vitest';
import { directOpenToast } from './directOpenToast';

describe('directOpenToast', () => {
  it('describes a new chat', () => {
    expect(directOpenToast('Jaipur Emporium', 'created')).toBe('Chat started with Jaipur Emporium');
  });

  it('describes an existing chat', () => {
    expect(directOpenToast('Jaipur Emporium', 'existing')).toBe('Opened chat with Jaipur Emporium');
  });

  it('describes a restored chat', () => {
    expect(directOpenToast('Jaipur Emporium', 'restored')).toBe('Back in chat with Jaipur Emporium');
  });
});
