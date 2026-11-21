import type { ReferralView } from '@ekum/domain-types';
import { inviteShareCopy, shareOrCopyInvite, type ShareHandoffResult } from '@/lib/shareInvite';

/** Create an open connect-with-me invite and open the system share sheet. */
export async function shareOpenConnectInvite(options: {
  postReferral: () => Promise<ReferralView>;
  origin: string;
  companyName: string;
}): Promise<ShareHandoffResult> {
  const referral = await options.postReferral();
  const url = `${options.origin}/r/${referral.token}`;
  const copy = inviteShareCopy({
    kind: 'connect',
    companyName: options.companyName.trim() || referral.referrer.name,
  });
  return shareOrCopyInvite({ url, ...copy });
}
