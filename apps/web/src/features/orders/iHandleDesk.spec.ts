import { describe, expect, it } from 'vitest';
import {
  actorSellsThisOrder,
  isTraderDeskOperator,
  isTraderMillHop,
  itemsForMill,
  millCue,
  millDeskCardClass,
  millDeskDropped,
  millFromToCells,
  millLineForParent,
  millRevealLabel,
  orderDetailBehindTakeOver,
  orderDetailNextCue,
  orderDetailTakeOverHasWork,
  quotePrefillFromMills,
  showOrderParentItemsList,
  showSellerConfirmOnDesk,
  showSendQuoteOnDeskFace,
  traderActionsBehindTakeOver,
  traderDeskNextAction,
  traderDeskOrderId,
  orderTicketMillLabel,
  orderTicketMillNames,
  PATH_ON_ORDER_SCOPE,
  PATH_ON_PATHS_SCOPE,
  PATH_REVEAL_ON_ORDER_SCOPE,
  millsObserveMode,
  heldMillDesks,
  orderActionDock,
  showMillSendAll,
  showMillSendOnCard,
} from './iHandleDesk';
import type { OrderMillDeskView, OrderView } from '@ekum/domain-types';

/** Seed-like #DOWN mill card — reveal may be on or off; identity ≠ ops. */
const downMill = {
  upstreamOrderId: 'seed-order-handle-up',
  sellerName: 'Ahmedabad Loom Co',
  held: true,
  millQuoted: false,
  reveal: true,
} as NonNullable<OrderView['millDesks']>[number];

describe('iHandleDesk', () => {
  it('hides parent item list when mill desks already show designs', () => {
    expect(showOrderParentItemsList(undefined)).toBe(true);
    expect(showOrderParentItemsList([])).toBe(true);
    expect(showOrderParentItemsList([downMill])).toBe(false);
  });

  it('opens the parent ticket from a mill chat card', () => {
    expect(traderDeskOrderId({ id: 'mill-1', deskOrderId: 'meena-1' })).toBe('meena-1');
    expect(traderDeskOrderId({ id: 'meena-1' })).toBe('meena-1');
  });

  it('does not treat a Direct sharer as the seller', () => {
    expect(actorSellsThisOrder('mill', 'trader')).toBe(false);
    expect(actorSellsThisOrder('mill', 'mill')).toBe(true);
    expect(actorSellsThisOrder('mill', null)).toBe(false);
  });

  it('labels mill ticket as These mills when two+ shops and lists names quietly', () => {
    expect(orderTicketMillLabel([{ sellerName: 'Ahmedabad Loom Co' }], 'These mills')).toBe(
      'Ahmedabad Loom Co',
    );
    expect(
      orderTicketMillLabel(
        [{ sellerName: 'Ahmedabad Loom Co' }, { sellerName: 'Surat Mill' }],
        'These mills',
      ),
    ).toBe('These mills');
    expect(
      orderTicketMillNames([
        { sellerName: 'Ahmedabad Loom Co' },
        { sellerName: 'Surat Mill' },
      ]),
    ).toEqual(['Ahmedabad Loom Co', 'Surat Mill']);
    expect(orderTicketMillNames([{ sellerName: 'Ahmedabad Loom Co' }])).toEqual([]);
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

  it('docks Send all when two mills wait; quote is the teal when they do not', () => {
    const waiting = [
      { held: true, sellerName: 'A' },
      { held: true, sellerName: 'B' },
    ] as OrderView['millDesks'];
    expect(
      orderActionDock({
        isSeller: true,
        status: 'requested',
        millDesks: waiting,
        sendQuote: true,
        openForDispatch: false,
        hasRemaining: true,
        canSettle: false,
      }),
        ).toEqual({
          kind: 'requested',
          sendOrder: true,
          sendQuote: true,
          confirm: false,
          quoted: false,
        });
    expect(
      orderActionDock({
        isSeller: true,
        status: 'requested',
        millDesks: [{ held: true, sellerName: 'A' }] as OrderView['millDesks'],
        sendQuote: true,
        openForDispatch: false,
        hasRemaining: true,
        canSettle: false,
      }),
        ).toEqual({
          kind: 'requested',
          sendOrder: false,
          sendQuote: true,
          confirm: false,
          quoted: false,
        });
    expect(
      orderActionDock({
        isSeller: true,
        status: 'confirmed',
        sendQuote: false,
        openForDispatch: true,
        hasRemaining: true,
        canSettle: true,
        partiallyShipped: true,
      }),
    ).toEqual({ kind: 'fulfill', dispatch: true, dispatchMore: true, settle: true });
    expect(
      orderActionDock({
        isSeller: false,
        status: 'requested',
        sendQuote: true,
        openForDispatch: false,
        hasRemaining: true,
        canSettle: false,
      }),
    ).toEqual({
      kind: 'buy',
      cancel: true,
      edit: false,
      acceptQuote: false,
      acceptLogged: false,
      raiseReturn: false,
    });
    expect(
      orderActionDock({
        isSeller: false,
        status: 'requested',
        sendQuote: false,
        canAmend: true,
        canAcceptQuote: true,
        openForDispatch: false,
        hasRemaining: true,
        canSettle: false,
      }),
    ).toEqual({
      kind: 'buy',
      cancel: true,
      edit: true,
      acceptQuote: true,
      acceptLogged: false,
      raiseReturn: false,
    });
    expect(
      orderActionDock({
        isSeller: false,
        status: 'dispatched',
        sendQuote: false,
        openForDispatch: false,
        hasRemaining: false,
        canSettle: false,
      }),
    ).toEqual({
      kind: 'buy',
      cancel: false,
      edit: false,
      acceptQuote: false,
      acceptLogged: false,
      raiseReturn: true,
    });
    expect(
      orderActionDock({
        isSeller: true,
        status: 'requested',
        millDesks: [],
        sendQuote: true,
        openForDispatch: false,
        hasRemaining: true,
        canSettle: false,
      }),
    ).toEqual({
      kind: 'requested',
      sendOrder: false,
      sendQuote: true,
      confirm: true,
      quoted: false,
    });
    expect(
      orderActionDock({
        isSeller: true,
        status: 'requested',
        millDesks: [],
        sendQuote: true,
        hasSellerQuote: true,
        openForDispatch: false,
        hasRemaining: true,
        canSettle: false,
      }),
    ).toEqual({
      kind: 'requested',
      sendOrder: false,
      sendQuote: true,
      confirm: true,
      quoted: true,
    });
  });

  it('leaves a declined mill out of Send all', () => {
    const desks = [
      { held: true, sellerName: 'A' },
      { held: true, sellerName: 'B' },
      { held: true, sellerName: 'C' },
      { held: false, status: 'declined', sellerName: 'D' },
    ] as OrderView['millDesks'];
    expect(heldMillDesks(desks).map((desk) => desk.sellerName)).toEqual(['A', 'B', 'C']);
    expect(showMillSendAll(desks)).toBe(true);
  });

  it('offers Send all only when two or more mills are waiting', () => {
    expect(
      showMillSendAll([
        { held: true, sellerName: 'A' },
        { held: true, sellerName: 'B' },
      ] as OrderView['millDesks']),
    ).toBe(true);
    expect(
      showMillSendAll([
        { held: true, sellerName: 'A' },
        { held: false, sellerName: 'B' },
      ] as OrderView['millDesks']),
    ).toBe(false);
  });

  it('grays a declined mill card', () => {
    expect(millDeskDropped({ status: 'declined' })).toBe(true);
    expect(millDeskCardClass(true)).toContain('opacity-50');
    expect(millCue({ status: 'declined' } as OrderMillDeskView)).toBe('Declined');
  });

  it('hides Confirm on the I-handle desk', () => {
    expect(showSellerConfirmOnDesk([{ sellerName: 'Ahmedabad Loom' }] as OrderView['millDesks'])).toBe(
      false,
    );
    expect(showSellerConfirmOnDesk([])).toBe(true);
    expect(showSellerConfirmOnDesk(undefined)).toBe(true);
  });

  it('does not fold trader actions under More actions', () => {
    expect(
      traderActionsBehindTakeOver([{ sellerName: 'Ahmedabad Loom' }] as OrderView['millDesks']),
    ).toBe(false);
    expect(traderActionsBehindTakeOver([])).toBe(false);
  });

  /**
   * BM-09 — Reveal ON/OFF is identity only. Trader Desk cue / More actions require
   * selling the Manage parent; buyers with millDesks (reveal On) must not inherit them.
   */
  it('BM-09: Reveal does not grant trader desk ops to the buyer', () => {
    const millDesks = [downMill] as OrderView['millDesks'];

    // CASE 1–2: Ravi selling — trader chrome with or without reveal flag on the desk
    expect(isTraderDeskOperator('selling', millDesks)).toBe(true);
    expect(orderDetailBehindTakeOver('selling', millDesks)).toBe(false);
    expect(
      orderDetailNextCue({
        direction: 'selling',
        status: 'requested',
        counterpartName: 'Jaipur Emporium',
        millDesks,
      }),
    ).toBe('Your move: Send to Ahmedabad Loom Co');
    expect(
      orderDetailTakeOverHasWork({
        direction: 'selling',
        millDesks,
        status: 'requested',
        openForDispatch: false,
        hasRemaining: true,
      }),
    ).toBe(false);

    // CASE 3–4: Meena buying — even with mill desks (Reveal ON), no trader cue / More actions
    expect(isTraderDeskOperator('buying', millDesks)).toBe(false);
    expect(orderDetailBehindTakeOver('buying', millDesks)).toBe(false);
    expect(
      orderDetailNextCue({
        direction: 'buying',
        status: 'requested',
        counterpartName: 'Surat Silk House',
        millDesks,
      }),
    ).not.toMatch(/Send to Ahmedabad|More actions|Take over|Desk tools/i);
    expect(
      orderDetailTakeOverHasWork({
        direction: 'buying',
        millDesks,
        status: 'requested',
        openForDispatch: false,
        hasRemaining: true,
      }),
    ).toBe(false);

    // No mills → not a trader desk (bilateral)
    expect(isTraderDeskOperator('selling', [])).toBe(false);
    expect(isTraderDeskOperator('selling', undefined)).toBe(false);
  });

  it('does not open More actions just for chat', () => {
    const millDesks = [downMill] as OrderView['millDesks'];
    expect(
      orderDetailTakeOverHasWork({
        direction: 'selling',
        millDesks,
        status: 'settled',
        openForDispatch: false,
        hasRemaining: false,
        canSettle: false,
      }),
    ).toBe(false);
  });

  it('keeps Send quote on the face when mill desks exist', () => {
    expect(
      showSendQuoteOnDeskFace([
        { held: true, millQuoted: false, sellerName: 'AL' },
      ] as OrderView['millDesks']),
    ).toBe(true);
    expect(
      showSendQuoteOnDeskFace([
        { held: false, millQuoted: true, sellerName: 'AL' },
      ] as OrderView['millDesks']),
    ).toBe(true);
    expect(showSendQuoteOnDeskFace(undefined)).toBe(true);
  });

  it('mill Send stays on the card for Me and Mills ticket', () => {
    const desks = [
      { held: false, millQuoted: true, sellerName: 'AL' },
      { held: true, millQuoted: false, sellerName: 'Surat' },
    ] as OrderView['millDesks'];
    expect(millsObserveMode('mill', desks)).toBe(true);
    expect(millsObserveMode('me', desks)).toBe(false);
    expect(showSendQuoteOnDeskFace(desks, 'mill')).toBe(true);
    expect(showMillSendOnCard('mill', desks, false)).toBe(true);
    expect(showMillSendOnCard('mill', desks, true)).toBe(true);
    expect(showMillSendOnCard('me', desks, false)).toBe(true);
  });

  it('omits mill reveal when mill and buyer are the same shop', () => {
    expect(
      millRevealLabel(
        { sellerCompanyId: 'surat', sellerName: 'Surat Silk House' },
        { companyId: 'surat', name: 'Surat Silk House' },
      ),
    ).toBeNull();
    expect(
      millRevealLabel(
        { sellerCompanyId: 'kavita', sellerName: 'Ahmedabad Loom Co' },
        { companyId: 'meena', name: 'Jaipur Emporium' },
      ),
    ).toBe('Share a group');
    expect(PATH_ON_ORDER_SCOPE).toMatch(/this order/i);
    expect(PATH_ON_ORDER_SCOPE).toMatch(/next/i);
    expect(PATH_REVEAL_ON_ORDER_SCOPE).toMatch(/this (mill|order)/i);
    expect(PATH_REVEAL_ON_ORDER_SCOPE).toMatch(/next/i);
    expect(PATH_ON_PATHS_SCOPE).toMatch(/next orders only/i);
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

  it('Mills ticket still cues Send on the card, quote on the face', () => {
    expect(
      traderDeskNextAction({
        status: 'requested',
        counterpartName: 'Jaipur Emporium',
        laneTicket: 'mill',
        millDesks: [
          { held: true, millQuoted: false, sellerName: 'Ahmedabad Loom Co' },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Your move: Send to Ahmedabad Loom Co');
    expect(
      traderDeskNextAction({
        status: 'requested',
        counterpartName: 'Jaipur Emporium',
        laneTicket: 'mill',
        hasSellerQuote: false,
        millDesks: [
          { held: false, millQuoted: true, sellerName: 'Ahmedabad Loom Co' },
        ] as OrderView['millDesks'],
      }),
    ).toBe('Your move: Send quote to Jaipur Emporium');
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

  it('prefills qty on a declined line so Can’t supply can be unticked', () => {
    const prefill = quotePrefillFromMills(
      [{ id: 'p1', lineStatus: 'declined', quantity: 12, rate: null }] as OrderView['items'],
      undefined,
    );
    expect(prefill.qty.p1).toBe('12');
    expect(prefill.rates.p1).toBe('');
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
