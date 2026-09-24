import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agreementStepLabel,
  buildOrderTimelineSteps,
  collapseQuotedTrailEvents,
  shortOrderLabel,
  type CreateReturnDto,
  type DecideOrderLinesDto,
  type DispatchDto,
  type OrderItemView,
  type OrderView,
  type QuoteOrderDto,
  type ReturnView,
  type SendUpOrderDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { auditLine } from '@/features/catalog/productStatusSummary';
import {
  galleryIndexForItem,
  orderItemGalleryCaptions,
  orderItemGalleryDetails,
  orderItemGalleryUrls,
  urlsForOrderItem,
} from '@/features/orders/orderItemImages';
import { useCompanyId } from '@/lib/auth';
import { formatDate, formatRate, formatUnit } from '@/lib/format';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { returnStatusLabel } from '@/lib/status';
import { PageHeader } from '@/ui/PageHeader';
import { ConfirmActionSheet } from '@/ui/ConfirmActionSheet';
import { ShipProgressHint, SettleQtyColumns, SettlePendingSummary, fulfillmentRowClass, orderLineShowsPending } from '@/features/orders/shipProgressLabel';
import {
  defaultDispatchOn,
  defaultDispatchQty,
  dispatchPayloadLines,
  dispatchThisLrLabel,
  dispatchThisLrTally,
  lineDispatchQty,
  shippableDispatchItems,
  dispatchLineKindLine,
  dispatchLineCountLine,
} from '@/features/orders/dispatchSheet';
import {
  decideLinesPayload,
  decideLinesTally,
  defaultLineActions,
} from '@/features/orders/decideLinesSheet';
import { partyCompanyHref } from '@/features/orders/partyCompanyHref';
import {
  packingSlipFileName,
  packingSlipPdfBytes,
  shareOrDownloadPdf,
} from '@/features/orders/packingSlip';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { CheckIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { NoteVoiceField, type NoteVoiceValue } from '@/features/voice/NoteVoiceField';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import {
  itemsForMill,
  millCue,
  millDeskCardClass,
  millDeskDropped,
  millFromToCells,
  millLineForParent,
  millRevealLabel,
  actorSellsThisOrder,
  orderActionDock,
  orderDetailNextCue,
  orderTicketMillLabel,
  orderTicketMillNames,
  PATH_ON_ORDER_SCOPE,
  PATH_REVEAL_ON_ORDER_SCOPE,
  quotePrefillFromMills,
  showMillSendAll,
  showOrderParentItemsList,
  showSendQuoteOnDeskFace,
} from '@/features/orders/iHandleDesk';
import { TicketPathPick } from '@/features/orders/ticketPathPick';
import { HELP_BTN_CLASS, QuietHelpPop } from '@/features/orders/quietHelpPop';
import {
  allReturnLinesSelected,
  clearReturnSelection,
  selectAllReturnLines,
} from '@/features/orders/returnRaiseSelect';
import { parseQuoteRateDraft, quoteRateNumber, ratesWithSharedValue, SameRateForAll, sanitizeQuoteRateInput } from '@/features/orders/quoteSameRate';
import {
  orderLineCantSupplyCue,
  quoteCantSupplyControlClass,
  quoteCantSupplyMutedClass,
  quoteCantSupplyRowClass,
  quoteSheetItems,
  quoteUnavailableOnOpen,
} from '@/features/orders/quoteSheetItems';
import {
  Button,
  Card,
  ErrorState,
  Field,
  InlineNotice,
  LoadingBlock,
  Sheet,
  StatusPill,
  TextArea,
  TextInput,
  cx,
} from '@/ui/kit';
import { COMPACT_QTY_INPUT_CLASS, COMPACT_SHEET_NUM_INPUT_CLASS, COMPACT_SHEET_RATE_INPUT_CLASS } from '@/ui/mobileOverflow';
import { ORDER_QTY_SCOPE_ATTR, orderQtyInputProps } from '@/features/orders/orderQtyFocus';

/** Page Send quote — shorter than the sheet footer, still full width. */
const COMPACT_SEND_CLASS = 'min-h-10 w-full px-3 text-sm';
/** Mill card Send / Decline — chip-sized, not a full-bleed bar. */
const MILL_CARD_ACTION_CLASS = '!min-h-8 h-8 w-auto px-3 text-[13px]';

function RateFigure({
  amount,
  unit,
  qtyPrefix,
  muted,
}: {
  amount: string;
  unit: string;
  qtyPrefix?: string;
  muted?: boolean;
}) {
  return (
    <p
      className={cx(
        'text-center tabular-nums leading-tight',
        muted ? 'text-muted' : 'text-ink',
      )}
    >
      {qtyPrefix ? (
        <span className="text-[10px] font-medium text-muted">{qtyPrefix}</span>
      ) : null}
      <span className="text-sm font-semibold">{amount}</span>
      {unit ? (
        <span className="text-[10px] font-normal text-muted">{unit}</span>
      ) : null}
    </p>
  );
}

function rateAmount(rate: number | null): string {
  if (rate == null) return '—';
  return `₹${rate.toLocaleString('en-IN')}`;
}

function rateUnitSuffix(unit: string | null): string {
  const label = formatUnit(unit);
  return label ? `/${label}` : '';
}

function actionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function OrderTimeline({
  order,
  hidePriorQuotes = false,
}: {
  order: OrderView;
  /** Buyer: one live quote + Edited. Seller keeps full quote history. */
  hidePriorQuotes?: boolean;
}) {
  const rawTrail = order.trail ?? [];
  if (rawTrail.length > 0) {
    const { events: trail, quoteEditCount } = hidePriorQuotes
      ? collapseQuotedTrailEvents(rawTrail)
      : { events: rawTrail, quoteEditCount: 0 };
    return (
      <Card className="flex flex-col gap-0">
        <p className="mb-3 text-sm font-semibold text-ink">Timeline</p>
        <ol className="flex flex-col">
          {trail.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <div className="flex w-4 flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                {index < trail.length - 1 ? (
                  <span className="my-1 min-h-4 w-px flex-1 bg-accent/40" />
                ) : null}
              </div>
              <div className={cx('min-w-0 pb-3', index === trail.length - 1 && 'pb-0')}>
                <p className="text-sm font-medium text-ink">{step.summary ?? step.type}</p>
                <p className="text-xs text-muted">{formatDate(step.at)}</p>
                {hidePriorQuotes && step.type === 'quoted' && quoteEditCount > 0 ? (
                  <p className="text-xs text-muted">
                    Edited
                    {quoteEditCount > 1 ? ` · ${quoteEditCount} times` : ''}
                  </p>
                ) : null}
                {step.who ? <p className="text-[11px] text-muted">{step.who}</p> : null}
                {step.detail ? <p className="text-xs text-muted">{step.detail}</p> : null}
                {step.note ? (
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted">{step.note}</p>
                ) : null}
                {step.noteVoiceUrl ? (
                  <div className="mt-1">
                    <VoicePlayer
                      src={step.noteVoiceUrl}
                      durationMs={step.noteVoiceDurationMs}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  const steps = buildOrderTimelineSteps({
    ...order,
    returns: order.returns ?? [],
    staff: order.timelineStaff,
  });
  const amended =
    order.amendCount > 0 ||
    (order.status === 'requested' &&
      new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime() > 2000);

  return (
    <Card className="flex flex-col gap-0">
      <p className="mb-3 text-sm font-semibold text-ink">Timeline</p>
      <ol className="flex flex-col">
        {steps.map((step, index) => (
          <li key={step.key} className="flex gap-3">
            <div className="flex w-4 flex-col items-center">
              <span
                className={cx(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                  step.done || step.current ? 'bg-accent' : 'bg-line',
                )}
              />
              {index < steps.length - 1 ? (
                <span className={cx('my-1 w-px flex-1 min-h-4', step.done ? 'bg-accent/40' : 'bg-line')} />
              ) : null}
            </div>
            <div className={cx('min-w-0 pb-3', index === steps.length - 1 && 'pb-0')}>
              <p
                className={cx(
                  'text-sm font-medium',
                  step.done || step.current ? 'text-ink' : 'text-muted',
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted">{step.at ? formatDate(step.at) : '—'}</p>
              {step.staffLine ? (
                <p className="text-[11px] text-muted">{step.staffLine}</p>
              ) : null}
              {step.detail ? <p className="text-xs text-muted">{step.detail}</p> : null}
              {step.key === 'requested' && amended ? (
                <p className="text-xs text-muted">
                  Updated
                  {order.amendCount > 1 ? ` · ${order.amendCount} times` : ''} ·{' '}
                  {formatDate(order.updatedAt)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function PartyShopName({
  name,
  you,
  href,
}: {
  name: string;
  you: boolean;
  href: string | null;
}) {
  return (
    <>
      {href ? (
        <Link to={href} data-testid="order-party-profile" className="font-medium text-accent">
          {name}
        </Link>
      ) : (
        <span className="font-medium text-ink">{name}</span>
      )}
      {you ? ' (you)' : null}
    </>
  );
}

function lineStatusLabel(status: string): string {
  switch (status) {
    case 'declined':
      return 'Can’t supply';
    case 'confirmed':
      return 'Confirmed';
    case 'dispatched':
      return 'Dispatched';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Open';
  }
}

function OrderLinePhoto({
  item,
  items,
  onOpen,
  size = 'md',
}: {
  item: OrderItemView;
  items: OrderItemView[];
  onOpen: (index: number) => void;
  size?: 'md' | 'sm';
}) {
  const raw = urlsForOrderItem(item)[0];
  const url = raw ? toAbsoluteMediaUrl(raw) : '';
  const box =
    size === 'sm'
      ? 'h-12 w-12 min-h-12 min-w-12 shrink-0 rounded-lg'
      : 'h-14 w-14 min-h-14 min-w-14 shrink-0 rounded-xl';
  if (!url) {
    return (
      <div
        data-testid="order-line-photo"
        data-empty="true"
        className={cx(
          'flex items-center justify-center bg-foam text-muted',
          box,
          size === 'sm' ? 'text-sm font-bold' : 'text-base font-bold',
        )}
        aria-hidden
      >
        {item.name.charAt(0)}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-testid="order-line-photo"
      className={cx('overflow-hidden bg-foam', box)}
      aria-label={`View photo for ${item.name}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(galleryIndexForItem(items, item.id));
      }}
    >
      <img src={url} alt="" className="h-full w-full object-cover" />
    </button>
  );
}

function OrderLineCantSupplyFace({
  item,
  items,
  cantSupply,
  onOpen,
  size = 'md',
  children,
}: {
  item: OrderItemView;
  items: OrderItemView[];
  cantSupply: boolean;
  onOpen: (index: number) => void;
  size?: 'md' | 'sm';
  children?: ReactNode;
}) {
  const cue = orderLineCantSupplyCue(cantSupply);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className={cx('shrink-0', quoteCantSupplyMutedClass(cantSupply))}>
        <OrderLinePhoto item={item} items={items} onOpen={onOpen} size={size} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cx(
            'line-clamp-2 break-words text-sm font-medium',
            cantSupply ? 'text-muted' : 'text-ink',
            quoteCantSupplyMutedClass(cantSupply),
          )}
        >
          {item.name}
        </p>
        {children ? (
          <div className={quoteCantSupplyMutedClass(cantSupply)}>{children}</div>
        ) : null}
        {cue ? (
          <p className="text-xs font-semibold text-ink" data-testid="order-line-cant-supply-cue">
            {cue}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const companyId = useCompanyId();
  const [searchParams] = useSearchParams();
  const focusReturnId = searchParams.get('return');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeQty, setChangeQty] = useState<Record<string, string>>({});
  const [changeRate, setChangeRate] = useState<Record<string, string>>({});
  const [amendQty, setAmendQty] = useState<Record<string, string>>({});
  const [amendRemoved, setAmendRemoved] = useState<Set<string>>(() => new Set());
  const [dispatch, setDispatch] = useState<{
    transporter?: string;
    lrNumber?: string;
    parcelCount?: number;
  }>({});
  const [shipQty, setShipQty] = useState<Record<string, string>>({});
  const [shipOn, setShipOn] = useState<Record<string, boolean>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnReasonVoice, setReturnReasonVoice] = useState<NoteVoiceValue>(null);
  const [returnSelected, setReturnSelected] = useState<Record<string, boolean>>({});
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchNoteVoice, setDispatchNoteVoice] = useState<NoteVoiceValue>(null);
  const [amendNote, setAmendNote] = useState('');
  const [amendNoteVoice, setAmendNoteVoice] = useState<NoteVoiceValue>(null);
  const [linesNote, setLinesNote] = useState('');
  const [linesNoteVoice, setLinesNoteVoice] = useState<NoteVoiceValue>(null);
  const [actionNoteOpen, setActionNoteOpen] = useState<'cancel' | 'decline' | null>(null);
  const [deskHelp, setDeskHelp] = useState<null | 'ticket' | 'reveal'>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);
  const [millDeclineDesk, setMillDeclineDesk] = useState<
    { all: true } | { all?: false; upstreamOrderId: string; sellerName: string } | null
  >(null);
  const [actionNote, setActionNote] = useState('');
  const [actionNoteVoice, setActionNoteVoice] = useState<NoteVoiceValue>(null);
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteNoteVoice, setQuoteNoteVoice] = useState<NoteVoiceValue>(null);
  const [quoteVoiceBusy, setQuoteVoiceBusy] = useState(false);
  const [settleNote, setSettleNote] = useState('');
  const [settleNoteVoice, setSettleNoteVoice] = useState<NoteVoiceValue>(null);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [offerQty, setOfferQty] = useState<Record<string, string>>({});
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const [sharedQuoteRate, setSharedQuoteRate] = useState('');
  const [quoteSameOpen, setQuoteSameOpen] = useState(false);
  const [quoteSameDraft, setQuoteSameDraft] = useState('');
  const [sharedMillRate, setSharedMillRate] = useState('');
  const [millSameOpen, setMillSameOpen] = useState(false);
  const [millSameDraft, setMillSameDraft] = useState('');
  const [quoteRateDefaults, setQuoteRateDefaults] = useState<Record<string, string>>({});
  const [millRateDefaults, setMillRateDefaults] = useState<Record<string, string>>({});
  const [lineActions, setLineActions] = useState<Record<string, 'confirm' | 'decline'>>({});
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<OrderView>(`/orders/${id}`),
  });

  useEffect(() => {
    const desk = order.data?.deskOrderId;
    if (!desk || desk === id) return;
    navigate(`/orders/${desk}`, { replace: true });
  }, [order.data?.deskOrderId, id, navigate]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['order', id] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['returns'] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
    const threadId = order.data?.threadId;
    if (threadId) {
      void queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'messages'] });
    }
  };

  const act = useMutation({
    mutationFn: (action: string) => api.post<OrderView>(`/orders/${id}/${action}`, {}),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Action failed.'), 'danger'),
  });

  const actionWithNote = useMutation({
    mutationFn: () => {
      const action = actionNoteOpen;
      if (!action) throw new Error('No action');
      return api.post<OrderView>(`/orders/${id}/${action}`, {
        note: actionNote.trim() || undefined,
        noteVoiceMediaId: actionNoteVoice?.mediaId,
        noteVoiceDurationMs: actionNoteVoice?.durationMs,
      });
    },
    onSuccess: () => {
      setActionNoteOpen(null);
      setActionNote('');
      setActionNoteVoice(null);
      refresh();
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Action failed.'), 'danger'),
  });

  const sendUp = useMutation({
    mutationFn: (body: SendUpOrderDto) => api.post<OrderView>(`/orders/${id}/send-up`, body),
    onSuccess: (_view, vars) => {
      setChangeOpen(false);
      refresh();
      showToast(vars.upstreamOrderId ? 'Sent.' : 'Sent to waiting mills');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not send.'), 'danger'),
  });

  const millDecline = useMutation({
    mutationFn: (body: { upstreamOrderId?: string }) =>
      api.post<OrderView>(`/orders/${id}/mill-decline`, body),
    onSuccess: (_view, vars) => {
      setMillDeclineDesk(null);
      refresh();
      showToast(vars.upstreamOrderId ? 'Mill declined' : 'Waiting mills declined');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not decline this mill.'), 'danger'),
  });

  const millHold = useMutation({
    mutationFn: (body: { upstreamOrderId: string; held: boolean }) =>
      api.post<OrderView>(`/orders/${id}/mill-hold`, body),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Could not update.'), 'danger'),
  });

  const millReveal = useMutation({
    mutationFn: (body: { upstreamOrderId: string; reveal: boolean }) =>
      api.post<OrderView>(`/orders/${id}/mill-reveal`, body),
    onSuccess: refresh,
    onError: (err) => showToast(actionErrorMessage(err, 'Could not update.'), 'danger'),
  });

  const flipTicket = useMutation({
    mutationFn: (body: { ticket: 'me' | 'mill'; upstreamOrderId?: string }) =>
      api.post<OrderView>(`/orders/${id}/ticket`, body),
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (view.id !== id) {
        navigate(`/orders/${view.id}`, { replace: true });
        return;
      }
      refresh();
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not update.'), 'danger'),
  });

  const [millQty, setMillQty] = useState<Record<string, string>>({});
  const [millRate, setMillRate] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!order.data) return;
    const qty: Record<string, string> = {};
    const rate: Record<string, string> = {};
    for (const item of order.data.items) {
      qty[item.id] = String(item.quantity);
      rate[item.id] = item.rate != null ? String(item.rate) : '';
    }
    setMillQty(qty);
    setMillRate(rate);
    setMillRateDefaults(rate);
    setSharedMillRate('');
    setMillSameOpen(false);
    setMillSameDraft('');
  }, [order.data]);

  const takeControl = useMutation({
    mutationFn: () =>
      api.post<{ downstream: OrderView; upstream: OrderView; cancelledOrderId: string }>(
        `/orders/${id}/take-control`,
        {},
      ),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('You’re handling this order yourself.');
      navigate(`/orders/${result.downstream.id}`, { replace: true });
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not switch to handle yourself.'), 'danger'),
  });

  const openAmendSheet = () => {
    const items = order.data?.items ?? [];
    const qty: Record<string, string> = {};
    for (const item of items) {
      if (item.productId) qty[item.productId] = String(item.quantity);
    }
    setAmendQty(qty);
    setAmendRemoved(new Set());
    setSheetError(null);
    setAmendOpen(true);
  };

  const amendOrder = useMutation({
    mutationFn: () => {
      const items = (order.data?.items ?? [])
        .filter((item) => item.productId && !amendRemoved.has(item.productId))
        .map((item) => ({
          productId: item.productId!,
          quantity: Number(amendQty[item.productId!] || item.quantity),
          images: [] as string[],
        }))
        .filter((line) => line.quantity > 0);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'EMPTY_AMEND',
          message: 'Keep at least one design.',
        });
      }
      return api.post<OrderView>(`/orders/${id}/amend`, {
        items,
        note: amendNote.trim() || undefined,
        noteVoiceMediaId: amendNoteVoice?.mediaId,
        noteVoiceDurationMs: amendNoteVoice?.durationMs,
      });
    },
    onSuccess: () => {
      setAmendOpen(false);
      setAmendNote('');
      setAmendNoteVoice(null);
      setSheetError(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not update.')),
  });

  const shippableItems = useMemo(
    () => shippableDispatchItems(order.data?.items ?? []),
    [order.data?.items],
  );

  const dispatchTally = useMemo(
    () => dispatchThisLrTally(shippableItems, shipOn, shipQty),
    [shippableItems, shipOn, shipQty],
  );

  const dispatchOrder = useMutation({
    mutationFn: () => {
      const lrNumber = (dispatch.lrNumber ?? '').trim() || undefined;
      const items = dispatchPayloadLines(shippableItems, shipOn, shipQty);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'NOTHING_TO_SHIP',
          message: 'Turn on at least one design for this LR.',
        });
      }
      const dto: DispatchDto = {
        lrNumber,
        transporter: dispatch.transporter?.trim() || undefined,
        parcelCount: dispatch.parcelCount,
        items,
        note: dispatchNote.trim() || undefined,
        noteVoiceMediaId: dispatchNoteVoice?.mediaId,
        noteVoiceDurationMs: dispatchNoteVoice?.durationMs,
      };
      return api.post<OrderView>(`/orders/${id}/dispatch`, dto);
    },
    onSuccess: () => {
      setDispatchOpen(false);
      setDispatchError(null);
      setDispatchNote('');
      setDispatchNoteVoice(null);
      refresh();
      showToast('Dispatched.');
    },
    onError: (err) =>
      setDispatchError(actionErrorMessage(err, 'Could not dispatch.')),
  });

  const submitDispatch = () => {
    setDispatchError(null);
    if (dispatchPayloadLines(shippableItems, shipOn, shipQty).length < 1) {
      setDispatchError('Turn on at least one design for this LR.');
      return;
    }
    dispatchOrder.mutate();
  };

  const shareShipmentPdf = async (shipment: OrderView['shipments'][number]) => {
    if (!order.data) return;
    const input = {
      orderId: order.data.id,
      counterpartName: order.data.counterpart.name,
      shipment,
      note: order.data.note,
      orderItems: order.data.items,
    };
    try {
      const file = new File([packingSlipPdfBytes(input)], packingSlipFileName(input), {
        type: 'application/pdf',
      });
      await shareOrDownloadPdf(file);
    } catch {
      showToast('Could not share PDF.', 'danger');
    }
  };

  const settleOrder = useMutation({
    mutationFn: () =>
      api.post<OrderView>(`/orders/${id}/settle`, {
        note: settleNote.trim() || undefined,
        noteVoiceMediaId: settleNoteVoice?.mediaId,
        noteVoiceDurationMs: settleNoteVoice?.durationMs,
      }),
    onSuccess: (updated) => {
      setSettleOpen(false);
      setSettleNote('');
      setSettleNoteVoice(null);
      setSheetError(null);
      queryClient.setQueryData(['order', id], updated);
      refresh();
      if (updated.threadId) {
        void queryClient.invalidateQueries({
          queryKey: ['thread', updated.threadId, 'messages'],
        });
      }
      showToast('Order settled.');
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not settle.')),
  });

  const sendQuote = useMutation({
    mutationFn: () => {
      const dto: QuoteOrderDto = {
        note: quoteNote || undefined,
        noteVoiceMediaId: quoteNoteVoice?.mediaId,
        noteVoiceDurationMs: quoteNoteVoice?.durationMs,
        items: quoteSheetItems(order.data?.items ?? [])
          .filter((item) => item.lineStatus === 'open' || !unavailable[item.id])
          .map((item) =>
            unavailable[item.id]
              ? { orderItemId: item.id, unavailable: true as const }
              : {
                  orderItemId: item.id,
                  rate: quoteRateNumber(rates[item.id]) ?? Number(item.rate || 0),
                  quantity: Number(offerQty[item.id] || item.quantity),
                },
          ),
      };
      return api.post<OrderView>(`/orders/${id}/quote`, dto);
    },
    onSuccess: (updated) => {
      setQuoteOpen(false);
      setQuoteNote('');
      setQuoteNoteVoice(null);
      setQuoteVoiceBusy(false);
      setSheetError(null);
      refresh();
      if (updated.threadId) {
        void queryClient.invalidateQueries({ queryKey: ['thread', updated.threadId, 'messages'] });
        navigate(`/chats/${updated.threadId}`);
      }
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not send quote.')),
  });

  const decideLines = useMutation({
    mutationFn: (verb: 'confirm' | 'decline') => {
      const ids = (order.data?.items ?? [])
        .filter((item) => item.lineStatus === 'open')
        .map((item) => item.id);
      const dto: DecideOrderLinesDto = {
        items: decideLinesPayload(ids, lineActions, verb),
        note: linesNote.trim() || undefined,
        noteVoiceMediaId: linesNoteVoice?.mediaId,
        noteVoiceDurationMs: linesNoteVoice?.durationMs,
      };
      return api.post<OrderView>(`/orders/${id}/lines/decide`, dto);
    },
    onSuccess: () => {
      setLinesOpen(false);
      setLinesNote('');
      setLinesNoteVoice(null);
      setSheetError(null);
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not update lines.')),
  });

  const raiseReturn = useMutation({
    mutationFn: () => {
      const items = (order.data?.items ?? [])
        .filter((item) => item.lineStatus !== 'declined' && returnSelected[item.id])
        .map((item) => ({
          orderItemId: item.id,
          quantity: Number(returnQty[item.id] || 0),
        }))
        .filter((line) => line.quantity > 0);
      if (items.length < 1) {
        throw new ApiError({
          statusCode: 400,
          code: 'EMPTY_RETURN',
          message: 'Select at least one design to return.',
        });
      }
      const dto: CreateReturnDto = {
        orderId: id,
        reason: returnReason || undefined,
        reasonVoiceMediaId: returnReasonVoice?.mediaId,
        reasonVoiceDurationMs: returnReasonVoice?.durationMs,
        items,
      };
      return api.post('/returns', dto);
    },
    onSuccess: () => {
      setReturnOpen(false);
      setReturnReason('');
      setReturnReasonVoice(null);
      setSheetError(null);
      refresh();
    },
    onError: (err) => setSheetError(actionErrorMessage(err, 'Could not raise return.')),
  });

  const returnAct = useMutation({
    mutationFn: ({
      returnId,
      action,
    }: {
      returnId: string;
      action: 'approve' | 'decline' | 'resolve';
    }) => {
      if (action === 'approve') {
        return api.post<ReturnView>(`/returns/${returnId}/approve`, {});
      }
      return api.post<ReturnView>(`/returns/${returnId}/${action}`);
    },
    onSuccess: () => refresh(),
    onError: (err) =>
      showToast(actionErrorMessage(err, 'Could not update return.'), 'danger'),
  });

  useEffect(() => {
    if (!focusReturnId || !order.data?.returns?.length) return;
    const node = document.getElementById(`return-${focusReturnId}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusReturnId, order.data?.returns]);

  const openQuoteSheet = () => {
    const data = order.data;
    if (!data) return;
    const prefill = quotePrefillFromMills(data.items, data.millDesks);
    const quoteable = quoteSheetItems(data.items);
    const openIds = quoteable.filter((item) => item.lineStatus === 'open').map((item) => item.id);
    const prefills = openIds.map((id) => prefill.rates[id] ?? '').filter((v) => v !== '');
    const allSame =
      prefills.length > 0 && prefills.length === openIds.length && prefills.every((v) => v === prefills[0]);
    const shared = allSame && prefills[0] && prefills[0] !== '0' ? prefills[0] : '';
    setRates(prefill.rates);
    setQuoteRateDefaults(prefill.rates);
    setOfferQty(prefill.qty);
    setUnavailable((prev) => quoteUnavailableOnOpen(data.items, prev));
    setSharedQuoteRate(shared);
    setQuoteSameOpen(false);
    setQuoteSameDraft(shared);
    setQuoteNote('');
    setQuoteNoteVoice(null);
    setQuoteVoiceBusy(false);
    setSheetError(null);
    setQuoteOpen(true);
  };

  const openLinesSheet = () => {
    const ids = (order.data?.items ?? [])
      .filter((item) => item.lineStatus === 'open')
      .map((item) => item.id);
    setLineActions(defaultLineActions(ids));
    setSheetError(null);
    setLinesOpen(true);
  };

  const openDispatchSheet = () => {
    const pending = shippableDispatchItems(order.data?.items ?? []);
    setShipOn(defaultDispatchOn(pending));
    setShipQty(defaultDispatchQty(pending));
    setDispatch({});
    setDispatchError(null);
    setDispatchOpen(true);
  };

  const openReturnSheet = () => {
    const returnable = (order.data?.items ?? []).filter((item) => item.lineStatus !== 'declined');
    const next = selectAllReturnLines(returnable);
    setReturnSelected(next.selected);
    setReturnQty(next.qty);
    setSheetError(null);
    setReturnReason('');
    setReturnOpen(true);
  };

  const closeSheet = (
    which: 'quote' | 'lines' | 'dispatch' | 'settle' | 'amend' | 'return',
  ) => {
    setSheetError(null);
    if (which === 'quote') setQuoteOpen(false);
    if (which === 'lines') setLinesOpen(false);
    if (which === 'dispatch') {
      setDispatchError(null);
      setDispatchOpen(false);
    }
    if (which === 'settle') setSettleOpen(false);
    if (which === 'amend') setAmendOpen(false);
    if (which === 'return') setReturnOpen(false);
  };

  const quoteItems = useMemo(
    () => quoteSheetItems(order.data?.items ?? []),
    [order.data?.items],
  );

  const openItems = useMemo(
    () => quoteItems.filter((item) => item.lineStatus === 'open'),
    [quoteItems],
  );
  const openItemIds = useMemo(() => openItems.map((item) => item.id), [openItems]);
  const linesTally = useMemo(
    () => decideLinesTally(openItemIds, lineActions),
    [openItemIds, lineActions],
  );

  const returnableItems = useMemo(
    () => (order.data?.items ?? []).filter((item) => item.lineStatus !== 'declined'),
    [order.data?.items],
  );

  const returnReady = useMemo(
    () =>
      returnableItems.some(
        (item) =>
          returnSelected[item.id] &&
          Number(returnQty[item.id] || 0) > 0 &&
          Number(returnQty[item.id] || 0) <= item.quantity,
      ),
    [returnableItems, returnSelected, returnQty],
  );

  const returnSelectedCount = useMemo(
    () => returnableItems.filter((item) => returnSelected[item.id]).length,
    [returnableItems, returnSelected],
  );
  const returnAllSelected = useMemo(
    () => allReturnLinesSelected(returnableItems, returnSelected),
    [returnableItems, returnSelected],
  );

  const selectAllReturnable = () => {
    setSheetError(null);
    const next = selectAllReturnLines(returnableItems);
    setReturnSelected(next.selected);
    setReturnQty(next.qty);
  };

  const clearReturnable = () => {
    setSheetError(null);
    setReturnSelected(clearReturnSelection(returnableItems));
  };

  const quoteReady = useMemo(() => {
    const supplyable = quoteItems.filter((item) => !unavailable[item.id]);
    return (
      supplyable.length > 0 &&
      supplyable.every((item) => {
        const rateOk = quoteRateNumber(rates[item.id]) != null;
        const qty = Number(offerQty[item.id] || item.quantity || 0);
        return rateOk && qty > 0 && qty <= item.requestedQuantity;
      })
    );
  }, [quoteItems, rates, offerQty, unavailable]);

  const quoteSummary = useMemo(() => {
    const supplyable = quoteItems.filter((item) => !unavailable[item.id]);
    const total = supplyable.reduce((sum, item) => {
      const rate = quoteRateNumber(rates[item.id]) ?? 0;
      const qty = Number(offerQty[item.id] || item.quantity);
      return sum + rate * qty;
    }, 0);
    return { count: supplyable.length, total, of: quoteItems.length };
  }, [quoteItems, unavailable, rates, offerQty]);

  if (order.isLoading) {
    return <LoadingBlock label="Loading order…" />;
  }
  if (order.isError || !order.data) {
    return (
      <>
        <PageHeader title="Order" />
        <ErrorState message="This order isn't available." />
      </>
    );
  }

  const data = order.data;
  const photoGallery = orderItemGalleryUrls(data.items);
  const photoCaptions = orderItemGalleryCaptions(data.items);
  const photoDetails = orderItemGalleryDetails(data.items);
  const openPhotoViewer = (index: number) => {
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };
  const isSeller = actorSellsThisOrder(data.sellerCompanyId, companyId);
  const isBuyer = data.direction === 'buying';
  const millSendPatches = (desk: (typeof data.millDesks)[number]) =>
    itemsForMill(data.items, desk)
      .map((item) => ({
        productId: item.productId ?? undefined,
        quantity: Number(millQty[item.id] ?? item.quantity),
        rate: quoteRateNumber(millRate[item.id]) ?? undefined,
      }))
      .filter((row) => row.productId);
  const hasRemaining = data.items.some((item) => item.remainingQuantity > 0);
  const openForDispatch =
    data.status === 'confirmed' || data.status === 'part_shipped';
  const quoteOnFace = showSendQuoteOnDeskFace(data.millDesks, data.laneTicket);
  const actionDock = orderActionDock({
    isSeller,
    status: data.status,
    millDesks: data.millDesks,
    sendQuote: quoteOnFace && data.status === 'requested',
    hasSellerQuote: data.hasSellerQuote === true,
    canAmend: data.canAmend === true,
    canAcceptQuote: data.canAcceptQuote === true,
    canAcceptLogged: data.canAcceptLogged === true,
    openForDispatch,
    hasRemaining,
    canSettle: data.canSettle === true,
    partiallyShipped: data.partiallyShipped,
  });
  const nextCue = orderDetailNextCue({
    direction: isSeller ? 'selling' : 'buying',
    status: data.status,
    counterpartName: data.counterpart.name,
    hasSellerQuote: data.hasSellerQuote === true,
    millDesks: data.millDesks,
    laneTicket: data.laneTicket,
    partiallyShipped: data.partiallyShipped,
    intent: data.intent,
  });
  const isInquiry = data.intent === 'inquiry';
  const idLabel = shortOrderLabel(data.id, { inquiry: isInquiry });
  const sharedByYou =
    data.tradeMode === 'direct' &&
    data.facilitatorCompanyId &&
    companyId === data.facilitatorCompanyId;
  const roleSubtitle = sharedByYou
    ? `Shared · ${data.sellerName}`
    : isInquiry
      ? data.direction === 'buying'
        ? `Inquiry to ${data.counterpart.name}`
        : `Inquiry from ${data.counterpart.name}`
      : data.tradeMode === 'manage' && data.direction === 'selling'
        ? `Trading with ${data.counterpart.name}`
        : data.direction === 'buying'
          ? `You buy from ${data.counterpart.name}`
          : `You sell to ${data.counterpart.name}`;

  return (
    <div className={cx('flex flex-col gap-4', actionDock.kind !== 'none' && 'pb-24')}>
      <PageHeader
        title={`${idLabel} · ${data.counterpart.name}`}
        subtitle={`${roleSubtitle} · ${data.kind}`}
        action={
          <div className="flex flex-col items-end gap-0.5">
            <StatusPill status={data.status} />
            {isInquiry ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                Inquiry
              </span>
            ) : null}
            {/* Part shipped is only a mid-fulfillment pill/timeline cue — never after Settled. */}
            {data.partiallyShipped &&
            data.status === 'confirmed' &&
            data.status !== 'settled' ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                Part shipped
              </span>
            ) : null}
          </div>
        }
      />

      {nextCue ? (
        <p className="rounded-xl bg-foam px-3 py-2 text-sm font-medium text-ink">{nextCue}</p>
      ) : null}

      {data.canFlipTicket ? (
        <div data-testid="order-ticket-flip">
        <Card className="flex flex-col gap-2">
          <TicketPathPick
            ticket={data.laneTicket ?? 'me'}
            millLabel={orderTicketMillLabel(
              data.millDesks,
              data.tradeMode === 'direct' ? data.sellerName : 'These mills',
            )}
            millNames={orderTicketMillNames(data.millDesks)}
            disabled={flipTicket.isPending}
            onPick={(next) => flipTicket.mutate({ ticket: next })}
            pickTestId="order-ticket-pick"
            meTestId="order-ticket-me"
            millTestId="order-ticket-mill"
            help={
              <button
                type="button"
                data-testid="order-ticket-help"
                aria-label="What this means"
                className={HELP_BTN_CLASS}
                onClick={(event) => {
                  setHelpAnchor(event.currentTarget);
                  setDeskHelp((cur) => (cur === 'ticket' ? null : 'ticket'));
                }}
              >
                ?
              </button>
            }
          />
        </Card>
        </div>
      ) : null}

      <Card className="flex flex-col gap-1 text-sm">
        <p className="font-semibold text-ink">Parties</p>
        <p className="text-muted">
          Buyer ·{' '}
          <PartyShopName
            name={data.buyerName}
            you={data.direction === 'buying'}
            href={partyCompanyHref(data.direction === 'buying', data.buyerCompanyId)}
          />
        </p>
        <p className="text-muted">
          {data.tradeMode === 'manage' ? 'Trader' : 'Seller'} ·{' '}
          <PartyShopName
            name={data.sellerName}
            you={data.direction === 'selling'}
            href={partyCompanyHref(data.direction === 'selling', data.sellerCompanyId)}
          />
        </p>
        {data.threadId ? (
          <p className="pt-1">
            <Link
              to={
                data.livingMessageId
                  ? `/chats/${data.threadId}?message=${encodeURIComponent(data.livingMessageId)}`
                  : `/chats/${data.threadId}`
              }
              data-testid="order-open-chat"
              className="font-medium text-accent"
            >
              Open chat
            </Link>
          </p>
        ) : null}
        {data.tradeMode === 'direct' &&
        data.facilitatorCompanyId &&
        companyId === data.facilitatorCompanyId ? (
          <p className="pt-1 text-sm font-medium text-accent">Shared</p>
        ) : null}
        {(data.status === 'confirmed' || data.status === 'part_shipped') &&
        (data.confirmedByName || data.confirmedByRole) ? (
          <p className="pt-1 text-muted">
            {agreementStepLabel(data.confirmedByRole, data.confirmedByName)}
          </p>
        ) : null}
        {auditLine(data) ? (
          <p className="text-xs text-muted">{auditLine(data)}</p>
        ) : null}
      </Card>

      {data.needsQuotePass ? (
        <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-medium text-warning-ink">
          Mill sent rates — the buyer has not seen them
        </p>
      ) : null}

      {data.millDesks && data.millDesks.length > 0
        ? data.millDesks.map((desk) => {
            const rows = itemsForMill(data.items, desk);
            const cue = millCue(desk);
            const millDropped = millDeskDropped(desk);
            if (isBuyer) {
              return (
                <Card
                  key={desk.upstreamOrderId}
                  className={cx('flex flex-col gap-3', millDeskCardClass(millDropped))}
                  data-testid={
                    millDropped
                      ? `order-mill-declined-${desk.upstreamOrderId}`
                      : `order-buyer-mill-${desk.upstreamOrderId}`
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {desk.sellerName}
                        {!desk.held && !millDropped ? (
                          <span className="ml-1.5 text-xs font-semibold text-accent">
                            {shortOrderLabel(desk.upstreamOrderId)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">
                        {millDropped
                          ? 'Declined'
                          : cue ?? `${rows.length} design${rows.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    {!desk.held && !millDropped ? (
                      <StatusPill status={desk.status === 'requested' ? 'requested' : desk.status} />
                    ) : null}
                  </div>
                  {rows.map((item) => {
                    const millLine = millLineForParent(desk, item.id);
                    const cantSupply = item.lineStatus === 'declined';
                    return (
                      <div
                        key={item.id}
                        className={cx(
                          'flex items-center gap-3 border-t border-line pt-3',
                          quoteCantSupplyRowClass(cantSupply),
                        )}
                        data-testid={cantSupply ? 'order-line-cant-supply' : undefined}
                      >
                        <OrderLineCantSupplyFace
                          item={item}
                          items={data.items}
                          cantSupply={cantSupply}
                          onOpen={openPhotoViewer}
                        >
                          <p className="text-xs text-muted">
                            {item.quantity} × {formatRate(item.rate, item.unit)}
                            {millLine?.millRate != null && desk.millQuoted
                              ? ` · mill ₹${millLine.millRate.toLocaleString('en-IN')}`
                              : ''}
                          </p>
                        </OrderLineCantSupplyFace>
                      </div>
                    );
                  })}
                </Card>
              );
            }
            const revealLabel = millRevealLabel(desk, {
              companyId: data.buyerCompanyId,
              name: data.buyerName,
            });
            return (
              <Card
                key={desk.upstreamOrderId}
                className={cx('flex flex-col gap-3', millDeskCardClass(millDropped))}
                data-testid={millDropped ? `order-mill-declined-${desk.upstreamOrderId}` : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {desk.sellerName}
                      {!desk.held && !millDropped ? (
                        <span className="ml-1.5 text-xs font-semibold text-accent">
                          {shortOrderLabel(desk.upstreamOrderId)}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted">
                      {millDropped
                        ? 'Declined'
                        : desk.passHeld
                          ? 'Held'
                          : cue ?? `${rows.length} design${rows.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!desk.held && !millDropped ? (
                      <StatusPill status={desk.status === 'requested' ? 'requested' : desk.status} />
                    ) : null}
                    {!desk.held && !millDropped ? (
                      <details className="relative">
                        <summary className="cursor-pointer list-none px-1 text-lg leading-none text-muted">
                          ⋯
                        </summary>
                        <div className="absolute right-0 z-20 mt-1 min-w-[9rem] rounded-xl border border-line bg-surface p-1 shadow-sm">
                          <button
                            type="button"
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-foam"
                            disabled={millHold.isPending}
                            onClick={() =>
                              millHold.mutate({
                                upstreamOrderId: desk.upstreamOrderId,
                                held: !desk.passHeld,
                              })
                            }
                          >
                            {desk.passHeld ? `Resume ${desk.sellerName}` : `Hold ${desk.sellerName}`}
                          </button>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>
                {revealLabel && !millDropped ? (
                  <div
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-1.5 text-sm ${
                      desk.reveal
                        ? 'border-accent bg-accent/5 text-ink'
                        : 'border-line bg-surface text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{revealLabel}</span>
                      <button
                        type="button"
                        data-testid="order-mill-reveal-help"
                        aria-label="What this means"
                        className={HELP_BTN_CLASS}
                        onClick={(event) => {
                          setHelpAnchor(event.currentTarget);
                          setDeskHelp((cur) => (cur === 'reveal' ? null : 'reveal'));
                        }}
                      >
                        ?
                      </button>
                    </div>
                    <button
                      type="button"
                      data-testid={`order-mill-reveal-${desk.upstreamOrderId}`}
                      disabled={millReveal.isPending}
                      className="shrink-0 text-xs font-bold uppercase tracking-wide text-accent"
                      onClick={() =>
                        millReveal.mutate({
                          upstreamOrderId: desk.upstreamOrderId,
                          reveal: !desk.reveal,
                        })
                      }
                    >
                      {desk.reveal ? 'On' : 'Off'}
                    </button>
                  </div>
                ) : null}
                {!desk.held && desk.millQuoted ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-end gap-2 border-t border-line pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Design
                    </p>
                    <p className="text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                      From
                      <span className="mt-0.5 block truncate normal-case tracking-normal text-muted">
                        {desk.sellerName}
                      </span>
                    </p>
                    <p className="text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                      To
                      <span className="mt-0.5 block truncate normal-case tracking-normal text-muted">
                        {data.counterpart.name}
                      </span>
                    </p>
                  </div>
                ) : null}
                {desk.held ? (
                  <div className="flex flex-col gap-2 border-t border-line pt-2">
                    {rows.length > 1 ? (
                      <SameRateForAll
                        show
                        open={millSameOpen}
                        draft={millSameDraft}
                        applied={sharedMillRate}
                        onOpen={() => {
                          setMillSameDraft(sharedMillRate);
                          setMillSameOpen(true);
                        }}
                        onDraftChange={setMillSameDraft}
                        onApply={() => {
                          const parsed = parseQuoteRateDraft(millSameDraft);
                          if (!parsed) return;
                          const ids = rows.map((item) => item.id);
                          setMillRate((prev) => ({
                            ...prev,
                            ...ratesWithSharedValue(ids, parsed, millRateDefaults),
                          }));
                          setSharedMillRate(parsed);
                          setMillSameOpen(false);
                        }}
                        onCancel={() => setMillSameOpen(false)}
                      />
                    ) : null}
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_4.5rem_7rem] gap-x-2 gap-y-0"
                      {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}
                    >
                      <p className="pb-2 text-[10px] font-bold uppercase tracking-wide text-muted">
                        Design
                      </p>
                      <p className="pb-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                        Qty
                      </p>
                      <p className="pb-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                        Rate
                      </p>
                      {rows.map((item) => {
                        const cantSupply = item.lineStatus === 'declined';
                        return (
                        <div
                          key={item.id}
                          className={cx(
                            'col-span-3 grid grid-cols-subgrid items-center gap-x-2 border-t border-line pt-3',
                            quoteCantSupplyRowClass(cantSupply),
                          )}
                          data-testid={cantSupply ? 'order-line-cant-supply' : undefined}
                        >
                          <OrderLineCantSupplyFace
                            item={item}
                            items={data.items}
                            cantSupply={cantSupply}
                            onOpen={openPhotoViewer}
                          />
                          <TextInput
                            type="number"
                            className={COMPACT_SHEET_NUM_INPUT_CLASS}
                            value={millQty[item.id] ?? String(item.quantity)}
                            onChange={(e) =>
                              setMillQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            aria-label={`Quantity for ${item.name}`}
                            {...orderQtyInputProps(item.id === rows[rows.length - 1]?.id)}
                          />
                          <TextInput
                            inputMode="decimal"
                            className={COMPACT_SHEET_RATE_INPUT_CLASS}
                            value={
                              millRate[item.id] ?? (item.rate != null ? String(item.rate) : '')
                            }
                            onChange={(e) =>
                              setMillRate((prev) => ({
                                ...prev,
                                [item.id]: sanitizeQuoteRateInput(e.target.value),
                              }))
                            }
                            aria-label={`Rate for ${item.name}`}
                          />
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  rows.map((item) => {
                    const millLine = millLineForParent(desk, item.id);
                    const cells = desk.millQuoted
                      ? millFromToCells({
                          millQuoted: true,
                          millDeclined: millLine?.millDeclined ?? false,
                          millRate: millLine?.millRate ?? null,
                          millQuantity: millLine?.millQuantity ?? null,
                          buyerQuoted: data.hasSellerQuote === true,
                          buyerRate: item.rate,
                          buyerQuantity: item.quantity,
                          unit: item.unit,
                          formatAmount: rateAmount,
                          formatUnitSuffix: rateUnitSuffix,
                        })
                      : null;
                    const cantSupply = item.lineStatus === 'declined';
                    const pending = item.remainingQuantity ?? 0;
                    const showPending = !cantSupply && orderLineShowsPending(item);
                    return (
                      <div
                        key={item.id}
                        className={cx(
                          'pt-3',
                          showPending
                            ? 'rounded-xl border border-accent/40 bg-accent/5 px-2'
                            : 'border-t border-line',
                          quoteCantSupplyRowClass(cantSupply),
                          cells
                            ? 'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2'
                            : 'flex items-center gap-3',
                        )}
                        data-testid={
                          cantSupply
                            ? 'order-line-cant-supply'
                            : showPending
                              ? 'order-line-pending'
                              : undefined
                        }
                      >
                        <OrderLineCantSupplyFace
                          item={item}
                          items={data.items}
                          cantSupply={cantSupply}
                          onOpen={openPhotoViewer}
                        >
                          {!cells ? (
                            <p className="text-xs text-muted">
                              {item.quantity} × {formatRate(item.rate, item.unit)}
                            </p>
                          ) : null}
                          {showPending ? (
                            <p className="text-[11px] font-medium">
                              <ShipProgressHint shipped={item.shippedQuantity} pending={pending} />
                            </p>
                          ) : null}
                        </OrderLineCantSupplyFace>
                        {cells ? (
                          <>
                            <RateFigure
                              amount={cells.fromAmount}
                              unit={cells.fromUnit}
                              qtyPrefix={cells.fromQtyPrefix || undefined}
                              muted={cantSupply}
                            />
                            <RateFigure
                              amount={cells.toAmount}
                              unit={cells.toUnit}
                              muted={cantSupply || !data.hasSellerQuote}
                            />
                          </>
                        ) : null}
                      </div>
                    );
                  })
                )}
                {desk.held ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      className={MILL_CARD_ACTION_CLASS}
                      data-testid={`order-mill-decline-${desk.upstreamOrderId}`}
                      disabled={sendUp.isPending || millDecline.isPending}
                      onClick={() =>
                        setMillDeclineDesk({
                          upstreamOrderId: desk.upstreamOrderId,
                          sellerName: desk.sellerName,
                        })
                      }
                    >
                      Decline
                    </Button>
                    <Button
                      className={MILL_CARD_ACTION_CLASS}
                      data-testid={`order-mill-send-${desk.upstreamOrderId}`}
                      aria-label={`Send to ${desk.sellerName}`}
                      onClick={() =>
                        sendUp.mutate({
                          upstreamOrderId: desk.upstreamOrderId,
                          items: millSendPatches(desk),
                        })
                      }
                      disabled={sendUp.isPending || millDecline.isPending}
                    >
                      {sendUp.isPending ? 'Sending…' : 'Send'}
                    </Button>
                  </div>
                ) : millDropped ? null : desk.revealThreadId ? (
                  <Button
                    variant="secondary"
                    className={COMPACT_SEND_CLASS}
                    data-testid={`order-mill-open-chat-${desk.upstreamOrderId}`}
                    onClick={() => navigate(`/chats/${desk.revealThreadId}`)}
                  >
                    Open group chat
                  </Button>
                ) : null}
              </Card>
            );
          })
        : null}

      {/* Mill desks already list every design (trader + Reveal-On buyer). No second aggregate card. */}
      {showOrderParentItemsList(data.millDesks) ? (
      <Card className="flex flex-col gap-2" data-testid="order-parent-items">
        {data.items.map((item) => {
          const pending = item.remainingQuantity ?? 0;
          const cantSupply = item.lineStatus === 'declined';
          const showPending = !cantSupply && orderLineShowsPending(item);
          return (
            <div
              key={item.id}
              className={cx(
                'flex items-center gap-3 rounded-xl px-2 py-2',
                showPending && 'border border-accent/40 bg-accent/5',
                quoteCantSupplyRowClass(cantSupply),
              )}
              data-testid={
                cantSupply
                  ? 'order-line-cant-supply'
                  : showPending
                    ? 'order-line-pending'
                    : undefined
              }
            >
              <OrderLineCantSupplyFace
                item={item}
                items={data.items}
                cantSupply={cantSupply}
                onOpen={openPhotoViewer}
              >
                {!cantSupply ? (
                  <p className="text-xs text-muted">
                    {item.quantity}
                    {item.requestedQuantity !== item.quantity
                      ? ` of ${item.requestedQuantity} asked`
                      : ''}{' '}
                    × {formatRate(item.rate, item.unit)}
                  </p>
                ) : (
                  <p className="text-xs text-muted">{item.requestedQuantity} asked</p>
                )}
                {!cantSupply ? (
                  <p className="text-[11px] font-medium">
                    <span className="text-slate">{lineStatusLabel(item.lineStatus)}</span>
                    {item.shippedQuantity > 0 || showPending ? (
                      <>
                        {' · '}
                        <ShipProgressHint shipped={item.shippedQuantity} pending={pending} />
                      </>
                    ) : null}
                  </p>
                ) : null}
                {item.note ? <p className="text-xs text-muted">{item.note}</p> : null}
              </OrderLineCantSupplyFace>
            </div>
          );
        })}
        {data.note ? <p className="border-t border-line pt-2 text-sm text-muted">{data.note}</p> : null}
        {data.noteVoiceUrl ? (
          <div className="border-t border-line pt-2">
            <VoicePlayer src={data.noteVoiceUrl} durationMs={data.noteVoiceDurationMs} />
          </div>
        ) : null}
      </Card>
      ) : data.note || data.noteVoiceUrl ? (
        <Card className="flex flex-col gap-2">
          {data.note ? <p className="text-sm text-muted">{data.note}</p> : null}
          {data.noteVoiceUrl ? (
            <VoicePlayer src={data.noteVoiceUrl} durationMs={data.noteVoiceDurationMs} />
          ) : null}
        </Card>
      ) : null}

      <OrderTimeline order={data} hidePriorQuotes={isBuyer} />

      {(data.returns ?? []).length > 0 ? (
        <Card className="flex flex-col gap-3 text-sm">
          <p className="font-semibold text-ink">Returns</p>
          {(data.returns ?? []).map((ret) => {
            const focused = focusReturnId === ret.id;
            return (
              <div
                key={ret.id}
                id={`return-${ret.id}`}
                className={cx(
                  'border-t border-line pt-3 first:border-0 first:pt-0',
                  focused && 'rounded-xl bg-foam/80 px-2.5 py-2',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">
                    {ret.items.length} {ret.items.length === 1 ? 'design' : 'designs'}
                    {ret.reason ? ` · ${ret.reason}` : ''}
                  </p>
                  <StatusPill status={ret.status} label={returnStatusLabel(ret.status)} />
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {ret.items.map((line) => (
                    <li key={line.id} className="text-sm text-ink">
                      <span className="font-medium">{line.name}</span>
                      <span className="text-muted">
                        {' '}
                        · return {line.requestedQuantity}
                        {line.approvedQuantity != null
                          ? ` · approved ${line.approvedQuantity}`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-xs text-muted">
                  Raised {formatDate(ret.createdAt)}
                </p>
                {ret.reasonVoiceUrl ? (
                  <div className="mt-2">
                    <VoicePlayer
                      src={ret.reasonVoiceUrl}
                      durationMs={ret.reasonVoiceDurationMs}
                    />
                  </div>
                ) : null}
                {isSeller && ret.status === 'requested' ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <Button
                      onClick={() =>
                        returnAct.mutate({ returnId: ret.id, action: 'approve' })
                      }
                      disabled={returnAct.isPending}
                    >
                      Approve return
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        returnAct.mutate({ returnId: ret.id, action: 'decline' })
                      }
                      disabled={returnAct.isPending}
                    >
                      Decline return
                    </Button>
                  </div>
                ) : null}
                {isSeller &&
                (ret.status === 'approved' || ret.status === 'partially_approved') ? (
                  <Button
                    className="mt-2"
                    onClick={() =>
                      returnAct.mutate({ returnId: ret.id, action: 'resolve' })
                    }
                    disabled={returnAct.isPending}
                  >
                    Mark return resolved
                  </Button>
                ) : null}
              </div>
            );
          })}
        </Card>
      ) : null}

      {data.shipments.length > 0 ? (
        <Card className="flex flex-col gap-3 text-sm">
          <p className="font-semibold text-ink">Shipments</p>
          {data.shipments.map((shipment) => (
            <div key={shipment.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
              <p className="font-medium text-ink">
                {shipment.lrNumber ? `LR · ${shipment.lrNumber}` : 'Dispatch'}
              </p>
              {shipment.transporter ? (
                <p className="text-muted">Transporter · {shipment.transporter}</p>
              ) : null}
              <p className="text-muted">
                {shipment.items.map((line) => `${line.name} × ${line.quantity}`).join(' · ')}
              </p>
              <p className="text-muted">Sent {formatDate(shipment.dispatchedAt)}</p>
              <Button
                variant="secondary"
                className="mt-2"
                data-testid="order-shipment-pdf"
                onClick={() => void shareShipmentPdf(shipment)}
              >
                PDF
              </Button>
            </div>
          ))}
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {data.canSendUp && !(data.millDesks && data.millDesks.length > 0) ? (
          <>
            <Button
              className={COMPACT_SEND_CLASS}
              onClick={() => sendUp.mutate({})}
              disabled={sendUp.isPending}
            >
              {sendUp.isPending ? 'Sending…' : 'Send'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const qty: Record<string, string> = {};
                const rate: Record<string, string> = {};
                for (const item of data.items) {
                  if (!item.productId) continue;
                  qty[item.productId] = String(item.quantity);
                  rate[item.productId] = item.rate != null ? String(item.rate) : '';
                }
                setChangeQty(qty);
                setChangeRate(rate);
                setSheetError(null);
                setChangeOpen(true);
              }}
            >
              Change
            </Button>
          </>
        ) : null}
        {data.canTakeControl ? (
          <Button
            variant="secondary"
            data-testid="order-handle-myself"
            onClick={() => takeControl.mutate()}
            disabled={takeControl.isPending}
          >
            Handle myself
          </Button>
        ) : null}
      </div>

      {actionDock.kind !== 'none' ? (
        <div
          data-testid="order-action-dock"
          className="fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-md gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur"
        >
          {actionDock.kind === 'buy' ? (
            <>
              {actionDock.acceptLogged ? (
                <Button
                  variant="ghost"
                  className="!min-h-10 shrink-0 px-2 text-sm"
                  data-testid="order-dock-decline"
                  disabled={act.isPending}
                  onClick={() => act.mutate('cancel')}
                >
                  Decline
                </Button>
              ) : actionDock.cancel ? (
                <Button
                  variant="ghost"
                  className="!min-h-10 shrink-0 px-2 text-sm"
                  data-testid="order-dock-cancel"
                  disabled={act.isPending || actionWithNote.isPending}
                  onClick={() => {
                    setActionNote('');
                    setActionNoteVoice(null);
                    setActionNoteOpen('cancel');
                  }}
                >
                  {isInquiry && data.status === 'requested' ? 'Cancel inquiry' : 'Cancel'}
                </Button>
              ) : null}
              {actionDock.edit ? (
                <Button
                  variant="secondary"
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-edit"
                  onClick={openAmendSheet}
                >
                  {isInquiry ? 'Edit inquiry' : 'Edit'}
                </Button>
              ) : null}
              {actionDock.acceptLogged ? (
                <Button
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-accept"
                  disabled={act.isPending}
                  onClick={() => act.mutate('accept')}
                >
                  Accept
                </Button>
              ) : null}
              {actionDock.acceptQuote ? (
                <Button
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-accept-quote"
                  disabled={act.isPending}
                  onClick={() => act.mutate('accept-quote')}
                >
                  Accept quote
                </Button>
              ) : null}
              {actionDock.raiseReturn ? (
                <Button
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-return-open"
                  onClick={openReturnSheet}
                >
                  Raise a return
                </Button>
              ) : null}
            </>
          ) : actionDock.kind === 'requested' ? (
            <>
              <Button
                variant="ghost"
                className="!min-h-10 shrink-0 px-2 text-sm"
                data-testid={actionDock.sendOrder ? 'order-mill-decline-all' : 'order-dock-decline'}
                disabled={act.isPending || actionWithNote.isPending || millDecline.isPending}
                onClick={() => {
                  if (actionDock.sendOrder) {
                    setMillDeclineDesk({ all: true });
                    return;
                  }
                  setActionNote('');
                  setActionNoteVoice(null);
                  setActionNoteOpen('decline');
                }}
              >
                Decline
              </Button>
              {actionDock.confirm && !actionDock.quoted ? (
                <Button
                  variant="secondary"
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-confirm"
                  onClick={openLinesSheet}
                >
                  Confirm
                </Button>
              ) : null}
              {actionDock.sendQuote ? (
                <Button
                  data-testid="order-send-quote"
                  variant={
                    actionDock.sendOrder || (actionDock.confirm && actionDock.quoted)
                      ? 'secondary'
                      : undefined
                  }
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  onClick={openQuoteSheet}
                >
                  Send quote
                </Button>
              ) : null}
              {actionDock.confirm && actionDock.quoted ? (
                <Button
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-dock-confirm"
                  onClick={openLinesSheet}
                >
                  Confirm
                </Button>
              ) : null}
              {actionDock.sendOrder ? (
                <Button
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  data-testid="order-mill-send-all"
                  disabled={sendUp.isPending || millDecline.isPending}
                  onClick={() =>
                    sendUp.mutate({
                      items: (data.millDesks ?? [])
                        .filter((desk) => desk.held)
                        .flatMap(millSendPatches),
                    })
                  }
                >
                  {sendUp.isPending ? 'Sending…' : 'Send all'}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {actionDock.settle ? (
                <Button
                  data-testid="order-settle-open"
                  variant={actionDock.dispatch ? 'secondary' : undefined}
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  onClick={() => {
                    setSettleNote('');
                    setSettleNoteVoice(null);
                    setSheetError(null);
                    setSettleOpen(true);
                  }}
                >
                  Settle
                </Button>
              ) : null}
              {actionDock.dispatch ? (
                <Button
                  data-testid="order-dispatch-open"
                  className="!min-h-10 min-w-0 flex-1 px-2.5 text-sm"
                  onClick={openDispatchSheet}
                >
                  {actionDock.dispatchMore ? 'Dispatch more' : 'Dispatch'}
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <Sheet open={quoteOpen} onClose={() => closeSheet('quote')} title="Send quote">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Quoting {quoteSummary.count} of {quoteSummary.of} · ₹
            {quoteSummary.total.toLocaleString('en-IN')}
          </p>
          {quoteItems.filter((item) => !unavailable[item.id]).length > 1 ? (
            <SameRateForAll
              show
              open={quoteSameOpen}
              draft={quoteSameDraft}
              applied={sharedQuoteRate}
              onOpen={() => {
                setQuoteSameDraft(sharedQuoteRate);
                setQuoteSameOpen(true);
              }}
              onDraftChange={setQuoteSameDraft}
              onApply={() => {
                const parsed = parseQuoteRateDraft(quoteSameDraft);
                if (!parsed) return;
                const ids = quoteItems
                  .filter((item) => !unavailable[item.id])
                  .map((item) => item.id);
                setRates((prev) => ({
                  ...prev,
                  ...ratesWithSharedValue(ids, parsed, quoteRateDefaults),
                }));
                setSharedQuoteRate(parsed);
                setQuoteSameOpen(false);
              }}
              onCancel={() => setQuoteSameOpen(false)}
            />
          ) : null}
          {(() => {
            const showFrom = (data.millDesks ?? []).some((desk) => desk.millQuoted && !desk.held);
            const cols = showFrom
              ? 'grid-cols-[minmax(0,1fr)_3.75rem_4.5rem_7rem]'
              : 'grid-cols-[minmax(0,1fr)_4.5rem_7rem]';
            const span = showFrom ? 4 : 3;
            const lastOfferQtyId = quoteItems.filter((item) => !unavailable[item.id]).at(-1)?.id;
            return (
              <div className={cx('grid gap-x-2 gap-y-0', cols)} {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
                <p className="pb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Design
                </p>
                {showFrom ? (
                  <p className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                    From
                  </p>
                ) : null}
                <p className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                  Qty
                </p>
                <p className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                  Rate
                </p>
                {quoteItems.map((item) => {
                  const millLine = (data.millDesks ?? [])
                    .filter((desk) => desk.millQuoted && !desk.held)
                    .map((desk) => ({ desk, line: millLineForParent(desk, item.id) }))
                    .find((row) => row.line && !row.line.millDeclined && row.line.millRate != null);
                  const fromRate = millLine?.line?.millRate ?? null;
                  const fromUnit = fromRate != null ? rateUnitSuffix(item.unit) : '';
                  const cantSupply = Boolean(unavailable[item.id]);
                  return (
                    <div
                      key={item.id}
                      className={cx(
                        'grid grid-cols-subgrid items-center gap-x-2 border-t border-line py-2 px-1.5 -mx-1.5',
                        quoteCantSupplyRowClass(cantSupply),
                      )}
                      data-testid={cantSupply ? `quote-row-declined-${item.id}` : undefined}
                      style={{ gridColumn: `span ${span} / span ${span}` }}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className={cx('shrink-0', quoteCantSupplyMutedClass(cantSupply))}>
                          <OrderLinePhoto
                            item={item}
                            items={data.items}
                            onOpen={openPhotoViewer}
                            size="sm"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cx(
                              'line-clamp-2 break-words text-sm font-medium',
                              quoteCantSupplyMutedClass(cantSupply),
                              cantSupply ? 'text-muted' : 'text-ink',
                            )}
                          >
                            {item.name}
                          </p>
                          {cantSupply ? (
                            <p
                              className={cx(
                                'text-[11px] font-medium text-muted',
                                quoteCantSupplyMutedClass(true),
                              )}
                            >
                              Declined
                            </p>
                          ) : null}
                          <label className={quoteCantSupplyControlClass(cantSupply)}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 shrink-0"
                              data-testid={`quote-cant-supply-${item.id}`}
                              checked={cantSupply}
                              onChange={(event) =>
                                setUnavailable((prev) => ({
                                  ...prev,
                                  [item.id]: event.target.checked,
                                }))
                              }
                            />
                            Can’t supply
                          </label>
                        </div>
                      </div>
                      {showFrom ? (
                        cantSupply ? (
                          <p
                            className={cx(
                              'text-center text-[11px] text-muted',
                              quoteCantSupplyMutedClass(true),
                            )}
                          >
                            —
                          </p>
                        ) : fromRate != null ? (
                          <div className="text-center">
                            <p className="text-sm font-semibold tabular-nums text-ink">
                              {rateAmount(fromRate)}
                            </p>
                            {fromUnit ? (
                              <p className="text-[10px] font-normal text-muted">{fromUnit}</p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-center text-[11px] text-muted">—</p>
                        )
                      ) : null}
                      {!cantSupply ? (
                        <TextInput
                          type="number"
                          min={1}
                          max={item.requestedQuantity}
                          className={COMPACT_SHEET_NUM_INPUT_CLASS}
                          value={offerQty[item.id] ?? ''}
                          onChange={(event) =>
                            setOfferQty((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          aria-label={`Quantity for ${item.name}`}
                          {...orderQtyInputProps(item.id === lastOfferQtyId)}
                        />
                      ) : (
                        <p
                          className={cx(
                            'text-center text-[11px] text-muted',
                            quoteCantSupplyMutedClass(true),
                          )}
                        >
                          —
                        </p>
                      )}
                      {cantSupply ? (
                        <p className={cx('text-center text-[11px] text-muted', quoteCantSupplyMutedClass(true))}>
                          —
                        </p>
                      ) : (
                        <TextInput
                          inputMode="decimal"
                          className={COMPACT_SHEET_RATE_INPUT_CLASS}
                          value={rates[item.id] ?? ''}
                          onChange={(event) =>
                            setRates((prev) => ({
                              ...prev,
                              [item.id]: sanitizeQuoteRateInput(event.target.value),
                            }))
                          }
                          aria-label={`Rate for ${item.name}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <NoteVoiceField
            label="Note"
            note={quoteNote}
            onNoteChange={setQuoteNote}
            voice={quoteNoteVoice}
            onVoiceChange={setQuoteNoteVoice}
            onBusyChange={setQuoteVoiceBusy}
          />
          {sheetError && quoteOpen ? <InlineNotice message={sheetError} /> : null}
          <Button
            fullWidth
            disabled={!quoteReady || sendQuote.isPending || quoteVoiceBusy}
            onClick={() => sendQuote.mutate()}
          >
            {sendQuote.isPending ? 'Sending…' : 'Send quote in chat'}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={linesOpen}
        onClose={() => closeSheet('lines')}
        title="Confirm / decline lines"
        footer={
          <div className="flex flex-col gap-2">
            {sheetError && linesOpen ? <InlineNotice message={sheetError} /> : null}
            <Button
              fullWidth
              disabled={openItems.length === 0 || linesTally.confirm < 1 || decideLines.isPending}
              onClick={() => decideLines.mutate('confirm')}
            >
              {decideLines.isPending && decideLines.variables === 'confirm'
                ? 'Saving…'
                : 'Confirm'}
            </Button>
            <Button
              fullWidth
              variant="danger"
              disabled={openItems.length === 0 || decideLines.isPending}
              onClick={() => decideLines.mutate('decline')}
            >
              {decideLines.isPending && decideLines.variables === 'decline'
                ? 'Saving…'
                : 'Decline'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2 pb-2">
          <p className="text-sm text-muted">
            Off is decline. Ship fewer pieces on Dispatch.
          </p>
          {openItems.length > 0 ? (
            <div
              className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2"
              data-testid="order-lines-tally"
            >
              <p className="min-w-0 truncate text-sm font-semibold text-accent">
                {linesTally.confirm} confirm
              </p>
              {linesTally.decline > 0 ? (
                <p className="shrink-0 text-[12px] font-medium text-muted">
                  {linesTally.decline} decline
                </p>
              ) : null}
            </div>
          ) : (
            <InlineNotice message="No open designs left." />
          )}
          {openItems.map((item) => {
            const on = lineActions[item.id] !== 'decline';
            return (
              <div
                key={item.id}
                className={cx(
                  'flex items-center gap-1.5 rounded-xl border px-2 py-1.5',
                  on ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                )}
                data-testid="order-lines-decide-row"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  aria-pressed={on}
                  aria-label={on ? `Decline ${item.name}` : `Confirm ${item.name}`}
                  onClick={() =>
                    setLineActions((prev) => ({
                      ...prev,
                      [item.id]: on ? 'decline' : 'confirm',
                    }))
                  }
                >
                  <span
                    className={cx(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                      on
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-surface text-transparent',
                    )}
                    aria-hidden
                  >
                    <CheckIcon width={12} height={12} />
                  </span>
                  <OrderLinePhoto
                    item={item}
                    items={data.items}
                    onOpen={openPhotoViewer}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                    <p className="mt-px truncate text-[11px] text-muted">
                      {item.quantity} ordered
                    </p>
                  </div>
                </button>
                <span className="w-14 shrink-0 text-right text-[11px] font-medium text-muted">
                  {on ? 'Confirm' : 'Decline'}
                </span>
              </div>
            );
          })}
          <NoteVoiceField
            label="Note"
            note={linesNote}
            onNoteChange={setLinesNote}
            voice={linesNoteVoice}
            onVoiceChange={setLinesNoteVoice}
          />
        </div>
      </Sheet>

      <Sheet
        open={dispatchOpen}
        onClose={() => closeSheet('dispatch')}
        title="Dispatch"
        footer={
          <div className="flex flex-col gap-2.5">
            <Field label="LR number">
              <TextInput
                value={dispatch.lrNumber ?? ''}
                placeholder="Optional"
                onChange={(event) =>
                  setDispatch((prev) => ({ ...prev, lrNumber: event.target.value }))
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Transporter">
                <TextInput
                  value={dispatch.transporter ?? ''}
                  placeholder="Optional"
                  onChange={(event) =>
                    setDispatch((prev) => ({ ...prev, transporter: event.target.value }))
                  }
                />
              </Field>
              <Field label="Parcels">
                <TextInput
                  type="number"
                  min={1}
                  value={dispatch.parcelCount ?? ''}
                  placeholder="Optional"
                  onChange={(event) =>
                    setDispatch((prev) => ({
                      ...prev,
                      parcelCount: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                />
              </Field>
            </div>
            {dispatchError ? <InlineNotice message={dispatchError} /> : null}
            <Button
              fullWidth
              data-testid="order-dispatch-confirm"
              onClick={submitDispatch}
              disabled={dispatchOrder.isPending || dispatchTally.designs < 1}
            >
              {dispatchOrder.isPending ? 'Saving…' : 'Confirm dispatch'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2 pb-2" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          {shippableItems.length === 0 ? (
            <InlineNotice message="No confirmed quantity pending to dispatch." />
          ) : (
            <>
              <div
                className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2"
                data-testid="order-dispatch-tally"
              >
                <p className="min-w-0 truncate text-sm font-semibold text-accent">
                  {dispatchThisLrLabel(dispatchTally)}
                </p>
                {dispatchTally.later > 0 ? (
                  <p className="shrink-0 text-[12px] font-medium text-muted">
                    {dispatchTally.later} pending
                  </p>
                ) : null}
              </div>
              {shippableItems.map((item) => {
                const on = shipOn[item.id] !== false;
                const kind = dispatchLineKindLine(item);
                const lastDispatchQtyId = shippableItems
                  .filter((line) => shipOn[line.id] !== false)
                  .at(-1)?.id;
                return (
                  <div
                    key={item.id}
                    className={cx(
                      'flex items-center gap-1.5 rounded-xl border px-2 py-1.5',
                      on ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                    )}
                    data-testid="order-dispatch-line"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      aria-pressed={on}
                      aria-label={on ? `Later ${item.name}` : `This LR ${item.name}`}
                      data-testid="order-dispatch-line-toggle"
                      onClick={() =>
                        setShipOn((prev) => ({
                          ...prev,
                          [item.id]: !on,
                        }))
                      }
                    >
                      <span
                        className={cx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                          on
                            ? 'border-accent bg-accent text-white'
                            : 'border-line bg-surface text-transparent',
                        )}
                        data-testid="order-dispatch-line-check"
                        aria-hidden
                      >
                        <CheckIcon width={12} height={12} />
                      </span>
                      <OrderLinePhoto
                        item={item}
                        items={data.items}
                        onOpen={openPhotoViewer}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p
                          data-testid="order-dispatch-line-name"
                          className="truncate text-sm font-semibold text-ink"
                        >
                          {item.name}
                        </p>
                        <p className="mt-px truncate text-[11px] text-muted">
                          {kind ? (
                            <span data-testid="order-dispatch-line-kind">{kind}</span>
                          ) : null}
                          {kind ? ' · ' : null}
                          <span data-testid="order-dispatch-line-counts">
                            {dispatchLineCountLine(item)}
                          </span>
                        </p>
                      </div>
                    </button>
                    <TextInput
                      type="number"
                      min={1}
                      max={item.remainingQuantity}
                      disabled={!on}
                      data-testid="order-dispatch-line-qty"
                      className={COMPACT_QTY_INPUT_CLASS}
                      value={shipQty[item.id] ?? String(lineDispatchQty(item, shipQty))}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        setShipQty((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                      {...orderQtyInputProps(item.id === lastDispatchQtyId)}
                    />
                  </div>
                );
              })}
            </>
          )}
          <NoteVoiceField
            label="Note"
            note={dispatchNote}
            onNoteChange={setDispatchNote}
            voice={dispatchNoteVoice}
            onVoiceChange={setDispatchNoteVoice}
          />
        </div>
      </Sheet>

      <Sheet
        open={settleOpen}
        onClose={() => closeSheet('settle')}
        title="Settle order"
        footer={
          <Button
            fullWidth
            data-testid="order-settle-confirm"
            disabled={settleOrder.isPending}
            onClick={() => settleOrder.mutate()}
          >
            {settleOrder.isPending ? 'Settling…' : 'Settle order'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-sm text-muted">
            Won’t ship the rest. Ticket closes as Settled; quantities become what already shipped.
          </p>
          {(() => {
            const settleLines = (data.items ?? []).filter(
              (item) => item.lineStatus !== 'declined',
            );
            const pendingLines = settleLines.filter((item) => (item.remainingQuantity ?? 0) > 0);
            const pendingPieces = pendingLines.reduce(
              (sum, item) => sum + (item.remainingQuantity ?? 0),
              0,
            );
            return (
              <>
                <SettlePendingSummary
                  designCount={pendingLines.length}
                  pendingPieces={pendingPieces}
                />
                {settleLines.map((item) => {
                  const shipped = item.shippedQuantity ?? 0;
                  const pending = item.remainingQuantity ?? 0;
                  return (
                    <div
                      key={item.id}
                      className={cx(
                        'flex items-center gap-2',
                        fulfillmentRowClass(pending),
                      )}
                      data-testid={
                        pending > 0 ? 'settle-line-pending' : 'settle-line-done'
                      }
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <OrderLinePhoto
                          item={item}
                          items={data.items}
                          onOpen={openPhotoViewer}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                          <SettleQtyColumns dispatched={shipped} pending={pending} />
                        </div>
                      </div>
                      {pending > 0 ? (
                        <p
                          className="shrink-0 text-xl font-bold tabular-nums text-accent"
                          data-testid="settle-line-pending-qty"
                          aria-label={`${pending} pending`}
                        >
                          {pending}
                        </p>
                      ) : (
                        <p className="shrink-0 text-[12px] font-medium text-muted">Done</p>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
          <NoteVoiceField
            label="Note"
            note={settleNote}
            onNoteChange={setSettleNote}
            voice={settleNoteVoice}
            onVoiceChange={setSettleNoteVoice}
          />
          {sheetError && settleOpen ? <InlineNotice message={sheetError} /> : null}
        </div>
      </Sheet>

      <Sheet
        open={amendOpen}
        onClose={() => closeSheet('amend')}
        title={isInquiry ? 'Edit inquiry' : 'Edit order'}
      >
        <div className="flex flex-col gap-3" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          <p className="text-sm text-muted">
            Change quantities or remove designs before they respond. Adds show in chat as Updated.
          </p>
          {(data.items ?? [])
            .filter((item) => item.productId)
            .map((item) => {
              const pid = item.productId!;
              const removed = amendRemoved.has(pid);
              const lastAmendPid = [...(data.items ?? [])]
                .filter((line) => line.productId && !amendRemoved.has(line.productId))
                .at(-1)?.productId;
              return (
                <div
                  key={item.id}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border border-line p-3',
                    removed && 'opacity-50',
                  )}
                >
                  <OrderLinePhoto
                    item={item}
                    items={data.items}
                    onOpen={openPhotoViewer}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    {item.sku ? <p className="text-[11px] text-muted">{item.sku}</p> : null}
                  </div>
                  {!removed ? (
                    <TextInput
                      type="number"
                      min={1}
                      className={COMPACT_QTY_INPUT_CLASS}
                      value={amendQty[pid] ?? String(item.quantity)}
                      onChange={(event) =>
                        setAmendQty((prev) => ({ ...prev, [pid]: event.target.value }))
                      }
                      {...orderQtyInputProps(pid === lastAmendPid)}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="shrink-0 text-xs font-bold text-accent"
                    onClick={() =>
                      setAmendRemoved((prev) => {
                        const next = new Set(prev);
                        if (next.has(pid)) next.delete(pid);
                        else next.add(pid);
                        return next;
                      })
                    }
                  >
                    {removed ? 'Undo' : 'Remove'}
                  </button>
                </div>
              );
            })}
          <p className="text-xs text-muted">
            To add designs, open their collection, select more, and ask rates / order again — or keep
            editing quantities here.
          </p>
          {sheetError && amendOpen ? <InlineNotice message={sheetError} /> : null}
          <NoteVoiceField
            label="Note"
            note={amendNote}
            onNoteChange={setAmendNote}
            voice={amendNoteVoice}
            onVoiceChange={setAmendNoteVoice}
          />
          <Button fullWidth onClick={() => amendOrder.mutate()} disabled={amendOrder.isPending}>
            {amendOrder.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={returnOpen} onClose={() => closeSheet('return')} title="Raise a return">
        <div className="flex flex-col gap-3" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          {returnableItems.length > 0 ? (
            <div
              data-testid="return-raise-select-chrome"
              className="flex items-center justify-between gap-2"
            >
              <p className="text-sm font-semibold text-ink">
                {returnSelectedCount} of {returnableItems.length} selected
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="return-raise-select-all"
                  disabled={returnAllSelected}
                  className="text-xs font-bold text-accent disabled:opacity-40"
                  onClick={selectAllReturnable}
                >
                  Select all
                </button>
                <button
                  type="button"
                  data-testid="return-raise-clear"
                  className="text-xs font-bold text-accent"
                  onClick={clearReturnable}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Pick designs to return</p>
          )}
          {returnableItems.length === 0 ? (
            <InlineNotice message="No supplyable lines left to return." />
          ) : (
            returnableItems.map((item) => {
              const on = Boolean(returnSelected[item.id]);
              const lastReturnQtyId = returnableItems
                .filter((line) => returnSelected[line.id])
                .at(-1)?.id;
              return (
                <div
                  key={item.id}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border px-2.5 py-2',
                    on ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-pressed={on}
                    aria-label={on ? `Skip ${item.name}` : `Return ${item.name}`}
                    onClick={() => {
                      setSheetError(null);
                      setReturnSelected((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }));
                    }}
                  >
                    <OrderLinePhoto
                      item={item}
                      items={order.data?.items ?? []}
                      onOpen={openPhotoViewer}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                      <p className="truncate text-xs text-muted">Ordered {item.quantity}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{on ? 'Return' : 'Skip'}</span>
                  </button>
                  <TextInput
                    type="number"
                    min={1}
                    max={item.quantity}
                    disabled={!on}
                    className={COMPACT_QTY_INPUT_CLASS}
                    value={returnQty[item.id] ?? ''}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      setSheetError(null);
                      setReturnQty((prev) => ({ ...prev, [item.id]: event.target.value }));
                    }}
                    {...orderQtyInputProps(item.id === lastReturnQtyId)}
                  />
                </div>
              );
            })
          )}
          <NoteVoiceField
            label="Note"
            note={returnReason}
            onNoteChange={(value) => {
              setSheetError(null);
              setReturnReason(value);
            }}
            voice={returnReasonVoice}
            onVoiceChange={setReturnReasonVoice}
          />
          {sheetError && returnOpen ? <InlineNotice message={sheetError} /> : null}
          <Button
            fullWidth
            onClick={() => raiseReturn.mutate()}
            disabled={!returnReady || raiseReturn.isPending}
          >
            {raiseReturn.isPending ? 'Submitting…' : 'Submit return'}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="Change"
        footer={
          <Button
            fullWidth
            disabled={sendUp.isPending}
            onClick={() => {
              const items = (order.data?.items ?? [])
                .filter((item) => item.productId)
                .map((item) => {
                  const qty = Number(changeQty[item.productId!]);
                  const rateRaw = changeRate[item.productId!]?.trim();
                  const rate = rateRaw === '' ? undefined : Number(rateRaw);
                  return {
                    productId: item.productId!,
                    ...(Number.isFinite(qty) && qty > 0 ? { quantity: qty } : {}),
                    ...(rate != null && Number.isFinite(rate) ? { rate } : {}),
                  };
                });
              sendUp.mutate({ items });
            }}
          >
            {sendUp.isPending ? 'Sending…' : 'Send'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3" {...{ [ORDER_QTY_SCOPE_ATTR]: '' }}>
          <p className="text-sm text-muted">Edit qty or rate, then Send to the design owners.</p>
          {(order.data?.items ?? [])
            .filter((item) => item.productId)
            .map((item, index, list) => (
              <div key={item.id} className="flex items-center gap-3">
                <OrderLinePhoto
                  item={item}
                  items={order.data?.items ?? []}
                  onOpen={openPhotoViewer}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <div className="mt-1 flex gap-2">
                    <Field label="Qty">
                      <TextInput
                        type="number"
                        min={1}
                        className="min-h-10"
                        value={changeQty[item.productId!] ?? ''}
                        onChange={(event) =>
                          setChangeQty((prev) => ({
                            ...prev,
                            [item.productId!]: event.target.value,
                          }))
                        }
                        {...orderQtyInputProps(index === list.length - 1)}
                      />
                    </Field>
                    <Field label="Rate">
                      <TextInput
                        type="number"
                        min={0}
                        className="min-h-10"
                        value={changeRate[item.productId!] ?? ''}
                        onChange={(event) =>
                          setChangeRate((prev) => ({
                            ...prev,
                            [item.productId!]: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          {sheetError && changeOpen ? <InlineNotice message={sheetError} /> : null}
        </div>
      </Sheet>

      <QuietHelpPop
        open={deskHelp === 'ticket'}
        onClose={() => setDeskHelp(null)}
        testId="order-ticket-help-pop"
        anchor={helpAnchor}
      >
        <p className="font-medium">{PATH_ON_ORDER_SCOPE}</p>
        <p className="mt-1.5">You — they talk only to you. Mills stay hidden.</p>
        <p className="mt-1.5">These mills — buyer can see these shops on the order.</p>
      </QuietHelpPop>
      <QuietHelpPop
        open={deskHelp === 'reveal'}
        onClose={() => setDeskHelp(null)}
        testId="order-mill-reveal-help-pop"
        anchor={helpAnchor}
      >
        <p className="font-medium">{PATH_REVEAL_ON_ORDER_SCOPE}</p>
        <p className="mt-1.5">On — they share a group after you Send.</p>
        <p className="mt-1.5">Off — they only talk to you.</p>
      </QuietHelpPop>

      <ConfirmActionSheet
        open={millDeclineDesk != null}
        title={
          millDeclineDesk?.all
            ? 'Decline order?'
            : millDeclineDesk
              ? `Decline ${millDeclineDesk.sellerName}?`
              : 'Decline mill?'
        }
        body={
          millDeclineDesk?.all
            ? 'Waiting mills never see these lots.'
            : 'They never see this lot. Other mills stay.'
        }
        confirmLabel="Decline"
        testId="order-mill-decline-confirm"
        busy={millDecline.isPending}
        onCancel={() => setMillDeclineDesk(null)}
        onConfirm={() => {
          if (!millDeclineDesk) return;
          millDecline.mutate(
            millDeclineDesk.all ? {} : { upstreamOrderId: millDeclineDesk.upstreamOrderId },
          );
        }}
      />

      <Sheet
        open={actionNoteOpen != null}
        onClose={() => setActionNoteOpen(null)}
        title={actionNoteOpen === 'decline' ? 'Decline order' : 'Cancel order'}
        footer={
          <Button
            fullWidth
            disabled={actionWithNote.isPending}
            onClick={() => actionWithNote.mutate()}
          >
            {actionWithNote.isPending
              ? 'Saving…'
              : actionNoteOpen === 'decline'
                ? 'Decline order'
                : 'Cancel order'}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Optional note for the other shop.</p>
          <NoteVoiceField
            label="Note"
            note={actionNote}
            onNoteChange={setActionNote}
            voice={actionNoteVoice}
            onVoiceChange={setActionNoteVoice}
          />
        </div>
      </Sheet>

      <PhotoViewer
        open={photoViewerOpen && photoGallery.length > 0}
        urls={photoGallery}
        index={photoViewerIndex}
        onIndex={setPhotoViewerIndex}
        onClose={() => setPhotoViewerOpen(false)}
        captions={photoCaptions}
        details={photoDetails}
      />
    </div>
  );
}
