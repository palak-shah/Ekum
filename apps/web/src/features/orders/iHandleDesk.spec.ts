import { describe, expect, it } from 'vitest';
import {
  isTraderMillHop,
  itemsForMill,
  millCue,
  millFromToCells,
  millLineForParent,
  quotePrefillFromMills,
  showSellerConfirmOnDesk,
  showSendQuoteOnDeskFace,
  traderActionsBehindTakeOver,
  traderDeskNextAction,
  traderDeskOrderId,
} from './iHandleDesk';
import type { OrderMillDeskView, OrderView } from '@ekum/domain-types';

describe('iHandleDesk', () => {
  it('opens the parent ticket from a mill chat card', () => {
    expect(traderDeskOrderId({ id: 'mill-1', deskOrderId: 'meena-1' })).toBe('meena-1');
    expect(traderDeskOrderId({ id: 'meena-1' })).toBe('meena-1');
  });

  it('treats a buying hop with a parent as a mill subset', () => {
    expect(
      isTraderMillHop({
        downstreamOrderId: 'meena-1',
        direction: 'buying',
        tradeMode: 'bilateral',
      }),
    ).toBe(true);
    expect(
      isTraderMillHop({
        downstreamOrderId: null,
        direction: 'selling',
        tradeMode: 'manage',
      }),
    ).toBe(false);
  });

  it('groups parent lines onto a mill card', () => {
    const items = [{ id: 'a' }, { id: 'b' }] as OrderView['items'];
    const group = { itemIds: ['b'] } as OrderMillDeskView;
    expect(itemsForMill(items, group).map((row) => row.id)).toEqual(['b']);
  });

  it('cues mixed mill outcomes without dropping Meena copy', () => {
    expect(
      millCue({ confirmedCount: 1, declinedCount: 1 } as OrderMillDeskView),
    ).toBe('1 confirmed · 1 can’t supply');
  });

  it('hides Confirm on the I-handle desk', () => {
    expect(showSellerConfirmOnDesk([{ sellerName: 'Ahmedabad Loom' }] as OrderView['millDesks'])).toBe(
      false,
    );
    expect(showSellerConfirmOnDesk([])).toBe(true);
    expect(showSellerConfirmOnDesk(undefined)).toBe(true);
  });

  it('puts trader actions under Take over whenever the desk has mills', () => {
    expect(
      traderActionsBehindTakeOver([{ sellerName: 'Ahmedabad Loom' }] as OrderView['millDesks']),
    ).toBe(true);
    expect(traderActionsBehindTakeOver([])).toBe(false);
    expect(traderActionsBehindTakeOver(undefined)).toBe(false);
  });

  it('keeps Send quote on the face only after a mill has quoted', () => {
    expect(
      showSendQuoteOnDeskFace([
        { held: true, millQuoted: false, sellerName: 'AL' },
      ] as OrderView['millDesks']),
    ).toBe(false);
    expect(
      showSendQuoteOnDeskFace([
        { held: false, millQuoted: false, sellerName: 'AL' },
      ] as OrderView['millDesks']),
    ).toBe(false);
    expect(
      showSendQuoteOnDeskFace([
        { held: false, millQuoted: true, sellerName: 'AL' },
      ] as OrderView['millDesks']),
    ).toBe(true);
    expect(showSendQuoteOnDeskFace(undefined)).toBe(false);
  });

  it('cues the trader desk by mill Send / quote pass, not bilateral confirm', () => {
    expect(
      traderDeskNextAction({
        status: 'requested',
        counterpartName: 'Jaipur Emporium',
        millDesks: [
          { held: true, millQuoted: false, sellerName: 'Ahmedabad Loom Co' },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Your move: Send to Ahmedabad Loom Co');
    expect(
      traderDeskNextAction({
        status: 'requested',
        counterpartName: 'Jaipur Emporium',
        millDesks: [
          { held: false, millQuoted: false, sellerName: 'Ahmedabad Loom Co' },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Waiting on Ahmedabad Loom Co for rates');
    expect(
      traderDeskNextAction({
        status: 'requested',
        counterpartName: 'Jaipur Emporium',
        hasSellerQuote: false,
        millDesks: [
          { held: false, millQuoted: true, sellerName: 'Ahmedabad Loom Co' },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Your move: Send quote to Jaipur Emporium');
    expect(
      traderDeskNextAction({
        status: 'requested',
        counterpartName: 'Jaipur Emporium',
        hasSellerQuote: true,
        millDesks: [
          { held: false, millQuoted: true, sellerName: 'Ahmedabad Loom Co' },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Waiting on Jaipur Emporium to accept quote');
    expect(traderDeskNextAction({ status: 'requested', counterpartName: 'X', millDesks: undefined })).toBe(
      null,
    );
  });

  it('does not wait on a mill that already settled', () => {
    expect(
      traderDeskNextAction({
        status: 'part_shipped',
        counterpartName: 'Jaipur Emporium',
        millDesks: [
          {
            held: false,
            millQuoted: true,
            sellerName: 'Ahmedabad Loom Co',
            status: 'settled',
          },
        ] as OrderView['millDesks'],
      }),
    ).toBeNull();
    expect(
      traderDeskNextAction({
        status: 'settled',
        counterpartName: 'Jaipur Emporium',
        millDesks: [
          {
            held: false,
            millQuoted: true,
            sellerName: 'Ahmedabad Loom Co',
            status: 'settled',
          },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Settled · complete');
    expect(
      traderDeskNextAction({
        status: 'part_shipped',
        counterpartName: 'Jaipur Emporium',
        millDesks: [
          {
            held: false,
            millQuoted: true,
            sellerName: 'Ahmedabad Loom Co',
            status: 'settled',
          },
          {
            held: false,
            millQuoted: true,
            sellerName: 'Jaipur Weaves',
            status: 'confirmed',
          },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Waiting on Jaipur Weaves to dispatch');
  });

  it('prefills Send quote from mill rates', () => {
    const prefill = quotePrefillFromMills(
      [
        { id: 'p1', lineStatus: 'open', quantity: 20, rate: null },
        { id: 'p2', lineStatus: 'open', quantity: 10, rate: 100 },
      ] as OrderView['items'],
      [
        {
          millQuoted: true,
          held: false,
          lines: [
            {
              parentItemId: 'p1',
              millRate: 85,
              millQuantity: 18,
              millDeclined: false,
            },
          ],
        },
      ] as OrderView['millDesks'],
    );
    expect(prefill.rates.p1).toBe('85');
    expect(prefill.qty.p1).toBe('18');
    expect(prefill.rates.p2).toBe('100');
  });

  it('shows rate cells under From / To headers', () => {
    expect(
      millFromToCells({
        millQuoted: true,
        millDeclined: false,
        millRate: 85,
        millQuantity: 20,
        buyerQuoted: false,
        buyerRate: null,
        buyerQuantity: 20,
        unit: 'mtr',
        formatAmount: (rate) => (rate == null ? '—' : `₹${rate}`),
        formatUnitSuffix: (unit) => (unit ? `/${unit}` : ''),
      }),
    ).toEqual({
      fromAmount: '₹85',
      fromUnit: '/mtr',
      fromQtyPrefix: '',
      toAmount: '—',
      toUnit: '',
    });

    expect(
      millFromToCells({
        millQuoted: true,
        millDeclined: false,
        millRate: 85,
        millQuantity: 20,
        buyerQuoted: true,
        buyerRate: 95,
        buyerQuantity: 20,
        unit: 'pc',
        formatAmount: (rate) => (rate == null ? '—' : `₹${rate}`),
        formatUnitSuffix: (unit) => (unit ? `/${unit}` : ''),
      }),
    ).toEqual({
      fromAmount: '₹85',
      fromUnit: '/pc',
      fromQtyPrefix: '',
      toAmount: '₹95',
      toUnit: '/pc',
    });
  });
});
