import { describe, expect, it } from 'vitest';
import { ordersListEmptyCopy } from './ordersListEmpty';

describe('ordersListEmptyCopy', () => {
  it('uses place-order copy on Buying, including completed', () => {
    expect(ordersListEmptyCopy({ tab: 'buying', status: 'pending', searching: false, complaintFind: false })).toEqual({
      title: 'No pending orders yet',
      message: 'Orders you place will appear here.',
    });
    expect(ordersListEmptyCopy({ tab: 'buying', status: 'completed', searching: false, complaintFind: false })).toEqual({
      title: 'No completed orders yet',
      message: 'Orders you place will appear here.',
    });
  });

  it('uses buyer-order copy on Selling', () => {
    expect(ordersListEmptyCopy({ tab: 'selling', status: 'completed', searching: false, complaintFind: false }).message).toBe(
      'Finished orders from buyers will appear here.',
    );
  });

  it('keeps Others about complaints and samples, and changes the title when finished', () => {
    expect(ordersListEmptyCopy({ tab: 'others', status: 'pending', searching: false, complaintFind: false })).toEqual({
      title: 'Nothing here yet',
      message: 'Complaints and applicable samples will appear here.',
    });
    expect(ordersListEmptyCopy({ tab: 'others', status: 'completed', searching: false, complaintFind: false }).title).toBe(
      'Nothing finished yet',
    );
  });
});