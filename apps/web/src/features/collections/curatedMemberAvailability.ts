import { ProductStatus } from '@ekum/domain-types';
import { isPublishedForSelection } from '@/features/browse/selectionEligibility';
import { reasonFromProductStatus } from '@/features/browse/selectionAvailability';

/** Mill ended the design (archive / unpublish). Album membership changes do not use this. */
export function curatedMemberUnavailableReason(status: string | undefined): string | undefined {
  if (isPublishedForSelection(status)) return undefined;
  return reasonFromProductStatus(status) ?? 'No longer available';
}

/** Own draft on a live pack — Publish here (pack-only, not an Explore design tile). */
export function canSetMemberLiveInPack(opts: {
  packPublished: boolean;
  productStatus: string | undefined;
  productCompanyId: string;
  ownerCompanyId: string | undefined;
}): boolean {
  return (
    opts.packPublished &&
    opts.productStatus === ProductStatus.Draft &&
    Boolean(opts.ownerCompanyId) &&
    opts.productCompanyId === opts.ownerCompanyId
  );
}
