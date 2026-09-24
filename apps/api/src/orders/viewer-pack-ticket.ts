/** Your paths ticket for this buyer on a curated pack. Missing lane = I handle. */
export function viewerPackTicket(input: {
  isOwner: boolean;
  millCompanyIds: string[];
  lanes: Array<{ sellerCompanyId: string; ticket: string }>;
}): 'me' | 'mill' | null {
  if (input.isOwner || input.millCompanyIds.length === 0) return null;
  const bySeller = new Map(
    input.lanes.map((lane) => [lane.sellerCompanyId, lane.ticket === 'mill' ? 'mill' : 'me']),
  );
  const tickets = input.millCompanyIds.map((id) => bySeller.get(id) ?? 'me');
  return tickets.every((ticket) => ticket === 'mill') ? 'mill' : 'me';
}
