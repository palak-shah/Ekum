import { isPublishedForSelection } from '@/features/browse/selectionEligibility';
import { reasonFromProductStatus } from '@/features/browse/selectionAvailability';

/** Mill ended the design (archive / unpublish). Album membership changes do not use this. */
export function curatedMemberUnavailableReason(status: string | undefined): string | undefined {
  if (isPublishedForSelection(status)) return undefined;
  return reasonFromProductStatus(status) ?? 'No longer available';
}
