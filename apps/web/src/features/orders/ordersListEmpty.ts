import type { OrdersListTab } from './ordersDirectionSession';

export function ordersListEmptyCopy(input: {
  tab: OrdersListTab;
  status: 'pending' | 'completed';
  searching: boolean;
  complaintFind: boolean;
}): { title: string; message: string } {
  if (input.searching) {
    return {
      title: input.complaintFind ? 'No complaints yet' : 'No matches',
      message: 'Try another find, or clear filters.',
    };
  }
  if (input.tab === 'others') {
    return {
      title: input.status === 'pending' ? 'Nothing here yet' : 'Nothing finished yet',
      message: 'Complaints and applicable samples will appear here.',
    };
  }
  if (input.tab === 'buying') {
    return {
      title:
        input.status === 'pending' ? 'No pending orders yet' : 'No completed orders yet',
      message: 'Orders you place will appear here.',
    };
  }
  return {
    title: input.status === 'pending' ? 'No pending orders yet' : 'No completed orders yet',
    message:
      input.status === 'pending'
        ? 'Orders from buyers will appear here.'
        : 'Finished orders from buyers will appear here.',
  };
}
