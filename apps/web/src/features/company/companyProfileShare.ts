import { companyShareCopy, shareMessageText } from '@/lib/shareInvite';

export function companyProfileShareUrl(origin: string, companyId: string): string {
  return `${origin.replace(/\/$/, '')}/company/${companyId}`;
}

export function companyProfileShareBody(companyName: string, url: string): string {
  return shareMessageText(companyShareCopy(companyName).text, url);
}
