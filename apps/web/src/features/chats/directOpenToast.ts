import type { DirectThreadOpen } from '@ekum/domain-types';

export function directOpenToast(businessName: string, opened: DirectThreadOpen): string {
  const name = businessName.trim() || 'them';
  switch (opened) {
    case 'created':
      return `Chat started with ${name}`;
    case 'restored':
      return `Back in chat with ${name}`;
    default:
      return `Opened chat with ${name}`;
  }
}
